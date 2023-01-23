import { ConnectorRequest, ConnectorRequestResponseContent, SendMessageRequest } from "@nmshd/connector-sdk";
import { RelationshipTemplateContent } from "@nmshd/content";
import config from "config";
import express from "express";
import fs from "fs";
import path from "path";
import { CONNECTOR_CLIENT } from "../enmeshed/connectorClient";
import { createRegistrationQRCode } from "../enmeshed/createRegistrationQRCode";
import { Attachment, SendCustomMessageRequest } from "./Attachment";
import { nmshdMagic } from "./enmeshedMagicModel";
import * as KeycloakHelper from "./keycloakHelperFunctions";
import { extractSessionId, getSocketFromCookie } from "./sessionHelper";

export class PublicRoutes {
  public static async registrationQR(req: express.Request, res: express.Response): Promise<any> {
    const connectSId = extractSessionId(req);
    const query: qs.ParsedQs = req.query;

    const patientBuffer = await createRegistrationQRCode(
      query.username?.toString(),
      connectSId,
      config.get("site.config.userData.req"),
      config.get("site.config.userData.opt"),
      query.confirmed?.toString() === "true",
      !req.headers.referer?.includes(req.headers.host!)
    );
    const patientBiStr = arrayBufferToStringArray(patientBuffer);
    res.send(patientBiStr);
  }

  public static async handleRegularRegistration(req: express.Request, res: express.Response): Promise<any> {
    const connectSId = extractSessionId(req);

    const socket = getSocketFromCookie(connectSId!);

    if (!socket) {
      console.error(`Socket for SessionID: ${connectSId} not found`);
      res.status(400).send(`Socket for SessionID: ${connectSId} not found`);
      return;
    }

    const body: any = req.body;

    if (!body?.password || !body?.username) {
      return res.status(400).send("The username and password query-parameters are mandatory!");
    }

    const status = await KeycloakHelper.register({
      userName: body.username,
      password: body.password,
      email: body.email,
      lastName: body.lastName,
      firstName: body.firstName,
      attributes: body.attributes,
      roles: body.roles
    });

    if (status === 201) {
      const keycloakTokens = await KeycloakHelper.loginAs(body.username, body.password);
      socket.emit("register", keycloakTokens);
      res.sendStatus(201);
    } else {
      return res.status(409).send("Username already taken!");
    }
  }

  public static async handleEnmeshedRelationshipWebhook(req: express.Request, res: express.Response): Promise<any> {
    if (req.headers["x-api-key"] !== config.get("connector.apiKey")) {
      return res.sendStatus(401);
    }

    const body: { trigger: string; data: ConnectorRequest } | undefined = req.body;

    res.sendStatus(200);
    if (!body) return;

    const request = body.data;

    const respnseSourceType = request.response!.source!.type;

    if (respnseSourceType === "Message") {
      await handleEnmeshedLogin(request);
      return;
    }

    // handle new relationship
    await handleEnmeshedRelationshipWebhookWithRelationshipResponseSourceType(request);
  }

  public static async loginWithEnmeshed(req: express.Request, res: express.Response): Promise<void> {
    await nmshdMagic.deleteMany({ expires: { $lt: Date.now() } });
    const query = req.query;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const magic = await nmshdMagic.find({ OTP: query.OTP });
    if (!magic[0]) return res.sendFile(path.resolve("public", "static", "failure.html"));

    if (magic[0].sessionID) {
      res.sendFile(path.resolve("public", "static", "success.html"));
    } else {
      const tokens = await KeycloakHelper.impersonate(magic[0].userId);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      await nmshdMagic.deleteMany({ OTP: query.OTP });
      req.session.user = parseJwt(tokens.access_token);
      const user = await KeycloakHelper.getUser(req.session.user.preferred_username);
      req.session.user.attributes = user!.attributes;
      res.redirect("/");
    }
  }

  public static getSiteConfig(_req: express.Request, res: express.Response): void {
    res.send({ ...config.get("site.config"), ...{ enableBasicAuth: config.get("server.enableBasicAuth") } });
  }

  public static getKeycloakConfig(_req: express.Request, res: express.Response): void {
    res.send(config.get("site.keycloak"));
  }

  public static async sendMessage(req: express.Request, res: express.Response): Promise<any> {
    const body: SendCustomMessageRequest = req.body;
    const content = body.content;

    if (!body.username || !content) return res.status(400).send("The username and content parameter is mandatory!");

    const user = await KeycloakHelper.getUser(body.username);

    if (!user?.attributes?.enmeshedAddress) {
      return res.status(400).send("User either not found or not connected with Enmeshed!");
    }
    const enmeshedAddress = user.attributes.enmeshedAddress[0];

    content["@type"] = "Mail";
    content.to = [enmeshedAddress];

    const attachmentIds: string[] = [];

    const attachments: Attachment[] | undefined = body.attachments;
    if (attachments) {
      for (const attachment of attachments) {
        let file;
        try {
          file = await fs.promises.readFile(attachment.path);
        } catch (e) {
          return res.status(400).send("File not Found");
        }
        const uploadOwnFileResponse = await CONNECTOR_CLIENT.files.uploadOwnFile({
          title: attachment.title,
          description: attachment.description,
          expiresAt: new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
          file: file,
          filename: attachment.filename
        });
        if (uploadOwnFileResponse.isError) return res.status(500).send(`Error uploading File: ${attachment.filename}`);
        attachmentIds.push(uploadOwnFileResponse.result.id);
      }
    }

    const message: SendMessageRequest = {
      recipients: [enmeshedAddress],
      content,
      attachments: attachmentIds
    };
    const response = await CONNECTOR_CLIENT.messages.sendMessage(message);
    if (response.isSuccess) {
      res.sendStatus(200);
    } else {
      res.status(500).send("Failed to send Message");
    }
  }
}

async function handleEnmeshedLogin(request: ConnectorRequest) {
  console.log(request);

  if (!(request.response?.content.result === "Accepted")) {
    return;
  }

  const sessionID: string = (request.content.metadata! as any).webSessionId;

  const peer = request.peer;

  const relationship = await CONNECTOR_CLIENT.attributes.getAttributes({
    content: { key: "userName" },
    shareInfo: { peer: peer }
  });

  if (relationship.isError) {
    console.error("User not found!");
    return;
  }

  const nmshdUser = relationship.result[0].content.value.value as string;

  const user = await KeycloakHelper.getUser(nmshdUser);
  const tokens = await KeycloakHelper.impersonate(user!.id);
  const socket = getSocketFromCookie(sessionID);
  if (!socket) {
    console.error(`Socket for SessionID: ${sessionID} not found`);
    return;
  }
  socket.emit("register", tokens);
}

async function handleEnmeshedRelationshipWebhookWithRelationshipResponseSourceType(request: ConnectorRequest) {
  const changeId = request.response!.source!.reference;

  const templateId = request.source!.reference;

  // @ts-expect-error
  const relationship = (await CONNECTOR_CLIENT.relationships.getRelationships({ template: { id: templateId } }))
    .result[0];

  const template = (await CONNECTOR_CLIENT.relationshipTemplates.getRelationshipTemplate(templateId)).result;

  const metadata: any = (template.content as RelationshipTemplateContent).metadata!;

  const change: ConnectorRequestResponseContent = request.response!.content;

  const external = metadata.external;

  await newcommerRegistration(change, metadata, relationship.id, changeId, external);
}

function parseJwt(token: string): any {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    Buffer.from(base64, "base64")
      .toString()
      .split("")
      .map(function (c) {
        return `%${"00".concat(c.charCodeAt(0).toString(16)).slice(-2)}`;
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
}

async function newcommerRegistration(
  change: ConnectorRequestResponseContent,
  metadata: any,
  relationshipId: string,
  changeId: string,
  external = false
) {
  const sId = metadata.webSessionId;
  const socket = getSocketFromCookie(sId);
  if (!socket && !external) {
    console.error(`Socket for SessionID: ${sId} not found`);
    return;
  }

  const response = await CONNECTOR_CLIENT.relationships.acceptRelationshipChange(relationshipId, changeId);

  const enmeshedAddress = response.result.peer;

  if (socket && response.isSuccess) {
    // Socket emit sucessfully onboarded
    socket.emit("scanned");
  }

  const content: any = {};

  content["@type"] = "Mail";
  content.to = [enmeshedAddress];
  content.body = "";
  content.subject = "Zeugnisübertragung";

  const attachmentIds: string[] = [];

  const attachments: Attachment[] = [];

  const certificateAttachment: Attachment = {
    title: "Zeugnis",
    description: "Abitur Zeugnis",
    path: "./attachment/zeugnis.pdf",
    filename: "zeugnis.pdf"
  };

  attachments.push(certificateAttachment);

  for (const attachment of attachments) {
    let file;
    try {
      file = await fs.promises.readFile(attachment.path);
    } catch (e) {
      return console.error("File not Found");
    }
    const uploadOwnFileResponse = await CONNECTOR_CLIENT.files.uploadOwnFile({
      title: attachment.title,
      description: attachment.description,
      expiresAt: new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
      file: file,
      filename: attachment.filename
    });
    if (uploadOwnFileResponse.isError) return console.error(`Error uploading File: ${attachment.filename}`);
    attachmentIds.push(uploadOwnFileResponse.result.id);
  }

  const message: SendMessageRequest = {
    recipients: [enmeshedAddress],
    content,
    attachments: attachmentIds
  };
  const sendMessageResponse = await CONNECTOR_CLIENT.messages.sendMessage(message);

  if (sendMessageResponse.isError) {
    return console.error(`Error sending message: ${JSON.stringify(message, null, 2)}`);
  }

  console.log("Sucessfully sent Credential");
}

function arrayBufferToStringArray(buffer: ArrayBuffer): string[] {
  const uInt8A = new Uint8Array(buffer);
  let i = uInt8A.length;
  const biStr = [];
  while (i--) {
    biStr[i] = String.fromCharCode(uInt8A[i]);
  }
  return biStr;
}
