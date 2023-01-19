import {
  ConnectorIdentityAttribute,
  ConnectorRequestContent,
  ConnectorRequestContentItemGroup,
  CreateOutgoingRequestRequestContentItemDerivations
} from "@nmshd/connector-sdk";
import config from "config";
import deepAssign from "deep-assign";
import { DateTime } from "luxon";
import { KeycloakUser } from "../routing/KeycloakUser";
import { CONNECTOR_CLIENT } from "./connectorClient";

export enum RegistrationType {
  Newcommer,
  Onboarding
}

const translationMap: any = {
  firstName: {
    "@type": "IdentityAttributeQuery",
    valueType: "GivenName"
  },
  lastName: {
    "@type": "IdentityAttributeQuery",
    valueType: "Surname"
  },
  gender: {
    "@type": "IdentityAttributeQuery",
    valueType: "Sex"
  },
  email: {
    "@type": "IdentityAttributeQuery",
    valueType: "EMailAddress"
  },
  phone: {
    "@type": "IdentityAttributeQuery",
    valueType: "PhoneNumber"
  }
};

export async function createRegistrationQRCode(
  type: RegistrationType,
  userName?: string,
  sId?: string,
  required?: [{ name: string; type: string }],
  optional?: [{ name: string; type: string }],
  userData?: KeycloakUser,
  confirmed = false,
  external = false
): Promise<ArrayBuffer> {
  // TODO: save identity in data structure so there does not have to be a api call on every QR-request
  const identity = (await CONNECTOR_CLIENT.account.getIdentityInfo()).result;

  const sharableDisplayName = await getOrCreateConnectorDisplayName(identity.address, config.get("connector.name"));

  const createItems: CreateOutgoingRequestRequestContentItemDerivations[] = [
    {
      "@type": "ShareAttributeRequestItem",
      mustBeAccepted: true,
      attribute: { ...sharableDisplayName.content, owner: "" },
      sourceAttributeId: sharableDisplayName.id
    }
  ];

  const proposedItems: CreateOutgoingRequestRequestContentItemDerivations[] = [];

  const requestItems: CreateOutgoingRequestRequestContentItemDerivations[] = [];

  if (userName) {
    createItems.push({
      "@type": "CreateAttributeRequestItem",
      mustBeAccepted: true,
      attribute: {
        "@type": "RelationshipAttribute",
        owner: identity.address,
        key: "userName",
        value: {
          "@type": "ProprietaryString",
          title: `${config.get("connector.name")}.userName`,
          value: userName
        },
        isTechnical: false,
        confidentiality: "public"
      }
    });
  }

  required?.forEach((element) => {
    const proposedValue = userData?.[`${element.name}`] || userData?.attributes?.[`${element.name}`];
    if (proposedValue) {
      proposedItems.push({
        "@type": "ProposeAttributeRequestItem",
        attribute: {
          "@type": "IdentityAttribute",
          owner: identity.address,
          value: {
            "@type": `${translationMap[element.name]?.valueType}`,
            value: proposedValue
          }
        },
        query: {
          "@type": "IdentityAttributeQuery",
          valueType: `${translationMap[element.name]?.valueType}`
        },
        mustBeAccepted: true
      });
    } else {
      requestItems.push({
        "@type": "ReadAttributeRequestItem",
        query: {
          "@type": "IdentityAttributeQuery",
          valueType: `${translationMap[element.name]?.valueType}`
        },
        mustBeAccepted: true
      });
    }
  });

  optional?.forEach((optionalElement) => {
    const proposedValue = userData?.[`${optionalElement.name}`] || userData?.attributes?.[`${optionalElement.name}`];
    if (proposedValue) {
      proposedItems.push({
        "@type": "ProposeAttributeRequestItem",
        attribute: {
          "@type": "IdentityAttribute",
          owner: identity.address,
          value: {
            "@type": `${translationMap[optionalElement.name]?.valueType}`,
            value: proposedValue
          }
        },
        query: {
          "@type": "IdentityAttributeQuery",
          valueType: `${translationMap[optionalElement.name]?.valueType}`
        },
        mustBeAccepted: false
      });
    } else {
      requestItems.push({
        "@type": "ReadAttributeRequestItem",
        query: {
          "@type": "IdentityAttributeQuery",
          valueType: `${translationMap[optionalElement.name]?.valueType}`
        },
        mustBeAccepted: false
      });
    }
  });

  const createObject: ConnectorRequestContentItemGroup = {
    "@type": "RequestItemGroup",
    mustBeAccepted: true,
    title: "Shared Attributes",
    items: createItems
  };

  const proposedObject: ConnectorRequestContentItemGroup = {
    "@type": "RequestItemGroup",
    mustBeAccepted: true,
    title: "Requested Attributes",
    items: proposedItems
  };

  const requestObject: ConnectorRequestContentItemGroup = {
    "@type": "RequestItemGroup",
    mustBeAccepted: true,
    title: "Requested Attributes",
    items: requestItems
  };

  const filteredItemObject = [createObject, proposedObject, requestObject].filter((el) => el.items[0]);

  const onNewRelationship: ConnectorRequestContent = {
    items: filteredItemObject
  };
  const requestPlausible = await CONNECTOR_CLIENT.outgoingRequests.canCreateRequest({ content: onNewRelationship });

  console.log(requestPlausible);

  if (!requestPlausible.result.isSuccess) {
    console.log("HELP");
    return new ArrayBuffer(0);
  }
  // Template erstellen
  const template = await CONNECTOR_CLIENT.relationshipTemplates.createOwnRelationshipTemplate(
    deepAssign(
      {},
      {
        maxNumberOfAllocations: 1,
        content: {
          "@type": "RelationshipTemplateContent",
          title: "Connector Demo Contact",
          metadata: {
            webSessionId: sId,
            type: type,
            external: external,
            confirmed: confirmed
          },
          onNewRelationship,
          onExistingRelationship: {
            metadata: {
              webSessionId: sId,
              type: type,
              external: external,
              confirmed: confirmed
            },
            items: [
              {
                "@type": "AuthenticationRequestItem",
                title: "Login Request",
                description:
                  "There has been a login request if you did not initiate it please ignore this message and do not approve!",
                mustBeAccepted: true,
                reqireManualDecision: true
              }
            ]
          }
        },
        expiresAt: DateTime.now().plus({ days: 2 }).toISO()
      },
      config.get("site.config.template")
    )
  );

  const image = await CONNECTOR_CLIENT.relationshipTemplates.createTokenQrCodeForOwnRelationshipTemplate(
    template.result.id
  );

  return image.result;
}

async function getOrCreateConnectorDisplayName(connectorAddress: string, displayName: string) {
  const response = await CONNECTOR_CLIENT.attributes.getValidAttributes({
    content: {
      owner: connectorAddress,
      value: {
        "@type": "DisplayName"
      }
    },
    shareInfo: {
      peer: "!"
    }
  });

  if (response.result.length > 0) {
    return response.result[0];
  }

  const createAttributeResponse = await CONNECTOR_CLIENT.attributes.createAttribute({
    content: {
      "@type": "IdentityAttribute",
      owner: connectorAddress,
      value: {
        "@type": "DisplayName",
        value: displayName
      }
    } as ConnectorIdentityAttribute
  });

  return createAttributeResponse.result;
}
