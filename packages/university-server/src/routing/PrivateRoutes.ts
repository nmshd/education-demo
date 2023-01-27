import {
  CanCreateOutgoingRequestRequest,
  ConnectorMessage,
  ConnectorRequest,
  ConnectorRequestValidationResult,
  ConnectorResponse,
  CreateOutgoingRequestRequest,
  SendMessageRequest
} from "@nmshd/connector-sdk";
import express from "express";
import { CONNECTOR_CLIENT } from "../enmeshed/connectorClient";
import { getUser } from "./keycloakHelperFunctions";

export class PrivateRoutes {
  public static async sendApplicationRequest(req: express.Request, res: express.Response): Promise<any> {
    const user = await getUser(req.session.user.preferred_username);
    const enmeshedAddress = user?.attributes?.enmeshedAddress;

    if (!enmeshedAddress) {
      console.error("User not onboarded, could not send application request.");
      return res.sendStatus(400);
    }

    const request: CanCreateOutgoingRequestRequest = {
      content: {
        title: "Connector Demo Contact",
        items: [
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "BirthDate"
            }
          },
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "BirthPlace"
            }
          },
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "Nationality"
            }
          },
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "Sex"
            }
          },
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "EMailAddress"
            }
          },
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "StreetAddress"
            }
          },
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "PhoneNumber"
            }
            // },
            // {
            //   "@type": "ReadAttributeRequestItem",
            //   mustBeAccepted: false,
            //   query: {
            //     "@type": "ThirdPartyRelationshipAttributeQuery",
            //     key: "typeOfDegree",
            //     owner: "",
            //     thirdParty: ["id1Jib6ENLfNR6hgKA2A2GJbTGeX5AWj1s67"]
            //   }
          }
        ]
      },
      peer: enmeshedAddress[0]
    };

    const validationResponse: ConnectorResponse<ConnectorRequestValidationResult> =
      await CONNECTOR_CLIENT.outgoingRequests.canCreateRequest(request);

    if (!validationResponse.isSuccess) {
      console.log(`an error occurred while validating the request: \n${JSON.stringify(request, null, 2)}`);
      return res.sendStatus(500);
    }

    const validatedRequest: CreateOutgoingRequestRequest = {
      content: request.content,
      peer: enmeshedAddress[0]
    };

    const requestResponse: ConnectorResponse<ConnectorRequest> = await CONNECTOR_CLIENT.outgoingRequests.createRequest(
      validatedRequest
    );

    if (!requestResponse.isSuccess) {
      console.log(`an error occurred while creating the request: \n${JSON.stringify(validatedRequest, null, 2)}`);
      return res.sendStatus(500);
    }

    const messageRequest: SendMessageRequest = {
      recipients: [enmeshedAddress[0]],
      content: requestResponse.result.content
    };

    const messageResponse: ConnectorResponse<ConnectorMessage> = await CONNECTOR_CLIENT.messages.sendMessage(
      messageRequest
    );

    if (!messageResponse.isSuccess) {
      console.log(`an error occurred while sending the message: \n${JSON.stringify(messageRequest, null, 2)}`);
      return res.sendStatus(500);
    }

    return res.sendStatus(200);
  }

  public static async sendMessageToUser(req: express.Request, res: express.Response): Promise<any> {
    const user = await getUser(req.session.user.preferred_username);
    const enmeshedAddress = user?.attributes?.enmeshedAddress;

    if (!enmeshedAddress) {
      console.error("User not onboarded, could not send application request.");
      return res.sendStatus(400);
    }

    const messageToSend = {
      "@type": "Mail",
      subject: "Nachforderung zur ihrer Bewerbung zur Immatrikulation",
      body: "Sehr geehrter Bewerber \n zum Einschreiben in den gewählten Studiengang ist ein Sprachzeugnis notwendig, bitte teilen sie dies über die enmeshed-Wallet oder laden sie es auf Webseite in ihr Konto hoch.",
      to: [enmeshedAddress[0]]
    };

    const messageRequest: SendMessageRequest = {
      content: messageToSend,
      recipients: [enmeshedAddress[0]],
      attachments: []
    };

    const messageResponse: ConnectorResponse<ConnectorMessage> = await CONNECTOR_CLIENT.messages.sendMessage(
      messageRequest
    );

    if (!messageResponse.isSuccess) {
      console.log(`an error occurred while sending the message: \n${JSON.stringify(messageRequest, null, 2)}`);
      return res.sendStatus(500);
    }
    return res.status(200).send("success");
  }
}
