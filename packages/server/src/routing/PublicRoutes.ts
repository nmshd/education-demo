import {
  ConnectorRequest,
  ConnectorRequestContentItemGroup,
  ConnectorRequestResponseContent,
  ConnectorRequestResponseItemGroup,
  CreateAttributeRequestItem,
  SendMessageRequest
} from "@nmshd/connector-sdk";
import { RelationshipTemplateContent } from "@nmshd/content";
import config from "config";
import express from "express";
import fs from "fs";
import path from "path";
import { CONNECTOR_CLIENT } from "../enmeshed/connectorClient";
import { createRegistrationQRCode, RegistrationType } from "../enmeshed/createRegistrationQRCode";
import { Attachment, SendCustomMessageRequest } from "./Attachment";
import { nmshdMagic } from "./enmeshedMagicModel";
import * as KeycloakHelper from "./keycloakHelperFunctions";
import { KeycloakUser } from "./KeycloakUser";
import { extractSessionId, getSocketFromCookie } from "./sessionHelper";

export class PublicRoutes {
  public static async registrationQR(req: express.Request, res: express.Response): Promise<any> {
    const connectSId = extractSessionId(req);
    const query: qs.ParsedQs = req.query;
    if (query.username && !query.patient) {
      const user = await KeycloakHelper.getUser(query.username.toString());
      if (user) return res.status(409).send("Username already taken!");
    }

    const patientBuffer = await createRegistrationQRCode(
      RegistrationType.Newcommer,
      query.username?.toString(),
      connectSId,
      config.get("site.config.userData.req"),
      config.get("site.config.userData.opt"),
      undefined,
      query.confirmed?.toString() === "true",
      !req.headers.referer?.includes(req.headers.host!)
    );
    const patientBiStr = arrayBufferToStringArray(patientBuffer);
    res.send(patientBiStr);
  }

  public static async onboardingQR(req: express.Request, res: express.Response): Promise<any> {
    const connectSId = extractSessionId(req);
    const query = req.query;
    if (!query.username) return res.status(400).send("The username query-parameter is mandatory!");
    const user = await KeycloakHelper.getUser(query.username.toString());
    if (connectSId && query.username && user) {
      if (user.attributes?.enmeshedAddress) return res.status(409).send("User allready connected to enmeshed!");
      // Converting QR image data to binary that will be converted to base64 in the Frontend
      const buffer = await createRegistrationQRCode(
        RegistrationType.Onboarding,
        query.username.toString(),
        connectSId,
        config.get("site.config.userData.req"),
        config.get("site.config.userData.opt"),
        user
      );
      const biStr = arrayBufferToStringArray(buffer);
      res.send(biStr);
    } else {
      res.status(404).send("User not found!");
    }
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

  // @ts-ignore
  const relationship = await CONNECTOR_CLIENT.attributes.getAttributes({
    content: { key: "userName" },
    shareInfo: { peer: peer }
  });

  if (relationship.isError) {
    console.error("User not found!");
    return;
  }

  const nmshdUser = relationship.result![0].content.value.value as string;

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

  // @ts-ignore
  const relationship = (await CONNECTOR_CLIENT.relationships.getRelationships({ template: { id: templateId } }))
    .result[0];

  const template = (await CONNECTOR_CLIENT.relationshipTemplates.getRelationshipTemplate(templateId)).result;

  const metadata: any = (template.content as RelationshipTemplateContent).metadata!;

  const username: string | undefined = (
    (request.content.items[0] as ConnectorRequestContentItemGroup).items[1] as CreateAttributeRequestItem
  )?.attribute?.value?.value as string;

  const type = metadata.type;

  const change: ConnectorRequestResponseContent = request.response!.content;

  if (!username) {
    const sId = metadata.webSessionId;
    const socket = getSocketFromCookie(sId);
    if (!socket) {
      console.error(`Socket for SessionID: ${sId} not found`);
      return await CONNECTOR_CLIENT.relationships.rejectRelationshipChange(relationship.id, changeId);
    }
    socket.emit("failedLogin", {
      english: "Failed Login: not connected to this Enmeshed-account",
      german: "Fehlgeschlagener Login: keine Verbindung zu diesem Enmeshed-account"
    });
    return await CONNECTOR_CLIENT.relationships.rejectRelationshipChange(relationship.id, changeId);
  }
  const external = metadata.external;

  switch (type) {
    case RegistrationType.Newcommer:
      await newcommerRegistration(change, username!, metadata, relationship.id, changeId, external);
      break;
    case RegistrationType.Onboarding:
      await onboardingRegistration(change, username!, metadata, relationship.id, changeId);
      break;
    default:
      console.error(`Unknown RegistrationType '${type}'`);
      return await CONNECTOR_CLIENT.relationships.rejectRelationshipChange(relationship.id, changeId);
  }
}

async function onboardingRegistration(
  change: ConnectorRequestResponseContent,
  username: string,
  metadata: any,
  relationshipId: string,
  changeId: string
) {
  const sId = metadata.webSessionId;

  const socket = getSocketFromCookie(sId);

  const userData = getUserData(change, username);

  const status = await KeycloakHelper.updateUser(userData);

  if (status === 204 || status === 201) {
    const response = await CONNECTOR_CLIENT.relationships.acceptRelationshipChange(relationshipId, changeId);
    if (response.isSuccess) {
      const user = await KeycloakHelper.getUser(userData.userName);
      const keycloakTokens = await KeycloakHelper.impersonate(user!.id);

      socket?.emit("onboard", keycloakTokens);
    }
  } else {
    await CONNECTOR_CLIENT.relationships.rejectRelationshipChange(relationshipId, changeId);
  }
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
  username: string,
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

  const userData = getUserData(change, username);

  const status = await KeycloakHelper.register({
    ...userData,
    ...{ password: KeycloakHelper.generateOTP() }
  });
  if (status === 201) {
    const response = await CONNECTOR_CLIENT.relationships.acceptRelationshipChange(relationshipId, changeId);
    if (response.isSuccess) {
      const user = await KeycloakHelper.getUser(userData.userName);
      if (socket) {
        const keycloakTokens = await KeycloakHelper.impersonate(user!.id);
        socket.emit("register", keycloakTokens);
      } else {
        await sendLoginLink(user!);
      }
    }
  } else {
    await CONNECTOR_CLIENT.relationships.rejectRelationshipChange(relationshipId, changeId);
  }
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

function getUserData(
  request: ConnectorRequestResponseContent,
  username?: string
): {
  userName: string;
  attributes?: any;
  firstName?: string;
  lastName?: string;
  email?: string;
} {
  const retValue = {
    userName: username ?? KeycloakHelper.generateOTP(),
    attributes: {},
    firstName: undefined,
    lastName: undefined,
    email: undefined
  };

  const normalKeycloakAttributes = ["Surname", "GivenName", "EMailAddress"];

  const entries = request.items.slice(1) as ConnectorRequestResponseItemGroup[];

  const attr: any = {};

  for (const entry of entries) {
    for (const item of entry.items) {
      if (item["@type"] === "ReadAttributeAcceptResponseItem") {
        const el: any = (item as any).attribute;
        if (el?.value) {
          if (!attr.enmeshedAddress) {
            Object.assign(attr, { enmeshedAddress: el.owner });
          }
          if (normalKeycloakAttributes.includes(el.value["@type"])) {
            switch (el.value["@type"]) {
              case "Surname":
                retValue.lastName = el.value.value;
                break;
              case "GivenName":
                retValue.firstName = el.value.value;
                break;
              case "EMailAddress":
                retValue.email = el.value.value;
                break;
              default:
                throw new Error("This is not possible");
            }
          } else {
            Object.assign(attr, { [el.value["@type"]]: el.value.value });
          }
        }
      }
    }
  }

  Object.assign(retValue.attributes, attr);

  console.log(retValue);

  return retValue;
}

async function sendLoginLink(userData: KeycloakUser) {
  const enmeshedAddress: string = userData.attributes!.enmeshedAddress![0];
  const OTP = KeycloakHelper.generateOTP();

  const data = new nmshdMagic({
    userId: userData.id,
    sessionID: "",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    OTP,
    code: 0,
    expires: Date.now() + 300000
  });

  data.save();

  const link = `${config.get("otp.url")}/api/v1/nmshdUserLogin?OTP=${OTP}`;

  const message: SendMessageRequest = {
    recipients: [enmeshedAddress],
    content: {
      "@type": "Mail",
      to: [enmeshedAddress],
      subject: "Login",
      body: `Hello there! \n<a href='${link}'>Click on this link to and you will be redirected to our website.</a>\nThe link is valid 5 minutes from now.`
    }
  };
  await CONNECTOR_CLIENT.messages.sendMessage(message);
}
