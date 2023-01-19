import axios from "axios";
import config from "config";
import { KeycloakUser, KeycloakUserWithRoles } from "./KeycloakUser";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const randExp = require("randexp");

const keycloakBaseUrl = config.get("keycloak.baseUrl");
const keycloakRealm = config.get("keycloak.realm");

// Retrieves Admin Token that is valid for 60s needed for specific operations (i.e: Registration or Login with Enmeshed)
export async function getAdminToken(realm = keycloakRealm): Promise<string> {
  const keycloakAdminConfig = config.get<{ username: string; password: string }>("keycloak.admin");

  const urlencoded = new URLSearchParams();
  urlencoded.append("client_id", "admin-cli");
  urlencoded.append("username", keycloakAdminConfig.username);
  urlencoded.append("password", keycloakAdminConfig.password);
  urlencoded.append("grant_type", "password");

  const response = await axios.post(`${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`, urlencoded);
  const json: any = await response.data;
  return json.access_token;
}

// Retrieve access-tokens from account that uses enmeshed PW or User PW in normal Registration case.
// This is needed for login after successful registration.
export async function loginAs(userName: string, password: string): Promise<string> {
  const urlencoded = new URLSearchParams();
  urlencoded.append("client_id", config.get("keycloak.client"));
  urlencoded.append("username", userName);
  urlencoded.append("password", password);
  urlencoded.append("grant_type", "password");

  const response = await axios.post(
    `${keycloakBaseUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`,
    urlencoded
  );

  return response.data;
}

// Creates a new user (if uName is not taken) with admin Token
export async function register(params: {
  userName: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  attributes?: Record<string, string>;
  roles?: string[];
}): Promise<number> {
  try {
    const adminToken = await getAdminToken();

    const response = await axios.post(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users`,
      {
        username: params.userName,
        enabled: true,
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        attributes: params.attributes,
        credentials: [{ type: "password", value: params.password }]
      },
      {
        headers: {
          authorization: `bearer ${adminToken}`,
          "Content-Type": "application/json" // eslint-disable-line @typescript-eslint/naming-convention
        }
      }
    );

    return response.status;
  } catch (e: any) {
    return e.status;
  }
}

// Get User from Keycloak
export async function getUser(userName: string): Promise<KeycloakUserWithRoles | undefined> {
  const adminToken = await getAdminToken();
  console.log(userName);
  const response = await axios.get(
    `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users?exact=true&username=${userName}`,
    {
      headers: { authorization: `Bearer ${adminToken}` }
    }
  );
  const user: KeycloakUserWithRoles | undefined = response.data[0];
  if (!user) return;
  const roleMappingResponse = await axios.get(
    `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${user.id}/role-mappings/realm`,
    {
      headers: { authorization: `Bearer ${adminToken}` }
    }
  );

  user.roles = roleMappingResponse.data.map((el: any) => el.name);
  return user;
}

// Get User from Keycloak
export async function getUserRoles(userId: string): Promise<any> {
  const adminToken = await getAdminToken();
  const response = await axios.get(
    `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${userId}/role-mappings/realm`,
    {
      headers: { authorization: `Bearer ${adminToken}` }
    }
  );
  return response.data;
}

// change User attributes
export async function updateUser(params: {
  userName: string;
  password?: string;
  vorName?: string;
  name?: string;
  email?: string;
  attributes?: Record<string, string>;
  addRoles?: string[];
  removeRoles?: string[];
}): Promise<number> {
  const adminToken = await getAdminToken();
  const user = await getUser(params.userName);

  const credentials = params.password ? [{ type: "password", value: params.password }] : undefined;

  if (!user) {
    const status = await register({
      ...params,
      ...{ password: generateOTP() }
    });
    return status;
  }

  const response = await axios.put(
    `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${user.id}`,
    {
      username: params.userName,
      firstName: params.vorName,
      lastName: params.name,
      email: params.email,
      attributes: params.attributes,
      credentials: credentials
    },
    {
      headers: {
        authorization: `bearer ${adminToken}`,
        "content-type": "application/json" // eslint-disable-line @typescript-eslint/naming-convention
      }
    }
  );

  return response.status;
}

// Impersonate User with admin token
export async function impersonate(userId: string): Promise<any> {
  const adminToken = await getAdminToken();

  const urlencoded = new URLSearchParams();
  urlencoded.append("client_id", "admin-cli");
  urlencoded.append("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
  urlencoded.append("subject_token", adminToken);
  urlencoded.append("requested_token_type", "urn:ietf:params:oauth:token-type:refresh_token");
  urlencoded.append("audience", config.get("keycloak.client"));
  urlencoded.append("requested_subject", userId);

  const response = await axios.post(
    `${keycloakBaseUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`,
    urlencoded,
    {
      headers: { authorization: `Bearer ${adminToken}` }
    }
  );

  return response.data;
}

export function generateOTP(): string {
  return new randExp(/\w{10,20}/).gen();
}
