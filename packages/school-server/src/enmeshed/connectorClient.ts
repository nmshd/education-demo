import { ConnectorClient } from "@nmshd/connector-sdk";
import config from "config";

export const CONNECTOR_CLIENT = ConnectorClient.create({
  baseUrl: config.get("connector.url"),
  apiKey: config.get("connector.apiKey")
});
