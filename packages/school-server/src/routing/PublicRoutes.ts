import { ConnectorRequest, ConnectorRequestResponseContent, SendMessageRequest } from "@nmshd/connector-sdk";
import config from "config";
import express from "express";
import fs from "fs";
import { CONNECTOR_CLIENT } from "../enmeshed/connectorClient";
import { createRegistrationQRCode } from "../enmeshed/createRegistrationQRCode";
import { Attachment, Content } from "./Attachment";
import { extractSessionId, getSocketFromCookie } from "./sessionHelper";

export class PublicRoutes {
  public static async registrationQR(req: express.Request, res: express.Response): Promise<any> {
    const connectSId = extractSessionId(req);

    const patientBuffer = await createRegistrationQRCode(
      connectSId,
      config.get("site.config.userData.req"),
      config.get("site.config.userData.opt")
    );
    const patientBiStr = arrayBufferToStringArray(patientBuffer);
    res.send(patientBiStr);
  }

  public static async handleEnmeshedRelationshipWebhook(req: express.Request, res: express.Response): Promise<any> {
    if (req.headers["x-api-key"] !== config.get("connector.apiKey")) {
      return res.sendStatus(401);
    }

    const body: { trigger: string; data: ConnectorRequest } | undefined = req.body;

    res.sendStatus(200);
    if (!body) return;

    const request = body.data;

    // handle new relationship
    await handleEnmeshedRelationshipWebhookWithRelationshipResponseSourceType(request);
  }

  public static getSiteConfig(_req: express.Request, res: express.Response): void {
    res.send({ ...config.get("site.config"), ...{ enableBasicAuth: config.get("server.enableBasicAuth") } });
  }
}

async function handleEnmeshedRelationshipWebhookWithRelationshipResponseSourceType(request: ConnectorRequest) {
  const changeId = request.response!.source!.reference;

  const templateId = request.source!.reference;

  // @ts-expect-error
  const relationship = (await CONNECTOR_CLIENT.relationships.getRelationships({ template: { id: templateId } }))
    .result[0];

  const template = (await CONNECTOR_CLIENT.relationshipTemplates.getRelationshipTemplate(templateId)).result;

  const metadata: any = (
    template.content as {
      "@type": "RelationshipTemplateContent";
      title?: string;
      metadata?: object;
      onNewRelationship: ConnectorRequest;
      onExistingRelationship?: ConnectorRequest;
    }
  ).metadata!;

  const change: ConnectorRequestResponseContent = request.response!.content;

  const external = metadata.external;

  await newcommerRegistration(change, metadata, relationship.id, changeId, external);
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

  const content: Content = {
    subject: "Zeugnisübertragung",
    body: ""
  };

  content["@type"] = "Mail";
  content.to = [enmeshedAddress];

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
