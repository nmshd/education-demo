import retry from "async-retry";
import axios from "axios";
import config from "config";
import { getAdminToken } from "./routing/keycloakHelperFunctions";
const keycloakBaseUrl: string = config.get("keycloak.baseUrl");
const keycloakRealm = config.get("keycloak.realm");
const keycloakClient = config.get("keycloak.client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const randExp = require("randexp");

export async function setupKeycloak(): Promise<void> {
  console.log("Waiting for Keycloakserver to start");
  const token = await retry(async () => await getAdminToken("master"), {
    retries: 5,
    minTimeout: 5000,
    onRetry: () => console.log("Waiting for Keycloakserver to start")
  });
  console.log("Checking if Keycloak setup is allready done 🔍");
  if (!(await isRealmSetup(token))) await setupRealm(token);
  let client;
  if (!(client = await isClientSetup(token))) {
    await setupClient(token);
  } else if (!isClientConfigCorrect(client)) {
    await updateClientConfig(client, token);
  }
  const clientId = await checkPermissions(token);
  if (clientId) await configurePermissions(clientId, token);
  if (!(await hasAdminUser(token))) {
    await createAdminUser(token);
  }
}

async function createAdminUser(token: string): Promise<void> {
  console.log("Admin user not found creating one");
  try {
    await axios.post(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users`,
      {
        username: config.get("keycloak.admin.username"),
        credentials: [{ type: "password", value: config.get("keycloak.admin.password") }],
        enabled: true
      },
      {
        headers: {
          authorization: `bearer ${token}`,
          "Content-Type": "application/json" // eslint-disable-line @typescript-eslint/naming-convention
        }
      }
    );
    const user = await axios.get(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users?exact=true&username=${config.get(
        "keycloak.admin.username"
      )}`,
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );
    const clientResponse = await axios.get(`${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const realmManagementClient = clientResponse.data.filter((el: any) => {
      return el.clientId === "realm-management";
    })[0];

    const roles = await axios.get(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${realmManagementClient.id}/roles`,
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );

    await axios.post(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${user.data[0].id}/role-mappings/clients/${realmManagementClient.id}`,
      roles.data,
      {
        headers: {
          authorization: `bearer ${token}`,
          "Content-Type": "application/json" // eslint-disable-line @typescript-eslint/naming-convention
        }
      }
    );
  } catch (e) {
    throw new Error(`Error creating admin User: \n${e}`);
  }
}

async function hasAdminUser(token: string): Promise<boolean> {
  console.log("Checking if admin user is present");
  const user = await axios.get(
    `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users?exact=true&username=${config.get(
      "keycloak.admin.username"
    )}`,
    {
      headers: { authorization: `Bearer ${token}` }
    }
  );
  return user.data.length > 0;
}

async function configurePermissions(id: string, token: string) {
  try {
    // Enable permissions for the Client
    await axios.put(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${id}/management/permissions`,
      {
        enabled: true
      },
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );

    // Get realm-management and admin-cli Client id
    const clientResponse = await axios.get(`${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const clientIds = clientResponse.data.filter((el: any) => {
      return el.clientId === "realm-management" || el.clientId === "admin-cli";
    });

    const realmManagementClient = clientIds.find((o: any) => o.clientId === "realm-management");
    const adminCliClient = clientIds.find((o: any) => o.clientId === "admin-cli");
    // Create token exchange policy
    const policyId = new randExp(/\w{20}/).gen();
    await axios.post(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${realmManagementClient.id}/authz/resource-server/policy/client`,
      {
        id: policyId,
        type: "client",
        logic: "POSITIVE",
        decisionStrategy: "UNANIMOUS",
        name: "token-exchange",
        clients: [adminCliClient.id]
      },
      {
        headers: {
          authorization: `bearer ${token}`,
          "Content-Type": "application/json" // eslint-disable-line @typescript-eslint/naming-convention
        }
      }
    );

    // Get token exchange scope ID
    const scopeIds = await axios.get(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${realmManagementClient.id}/authz/resource-server/scope`,
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );
    const tokenExchangeScopeId = scopeIds.data.find((el: any) => el.name === "token-exchange").id;

    const policyIds = await axios.get(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${realmManagementClient.id}/authz/resource-server/policy`,
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );
    const tokenExchangePolicy = policyIds.data.find((el: any) =>
      el.name.startsWith("token-exchange.permission.client.")
    );

    // Get resourceId
    const resourceIds = await axios.get(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${realmManagementClient.id}/authz/resource-server/resource`,
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );
    const clientResourceId = resourceIds.data.find((el: any) => el.name.startsWith("client.resource."))._id;
    // Activate token-exchange policy
    await axios.put(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${realmManagementClient.id}/authz/resource-server/permission/scope/${tokenExchangePolicy.id}`,
      {
        decisionStrategy: "UNANIMOUS",
        id: tokenExchangePolicy.id,
        logic: "POSITIVE",
        name: tokenExchangePolicy.name,
        scopes: [tokenExchangeScopeId],
        resources: [clientResourceId],
        policies: [policyId],
        type: "scope"
      },
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );

    console.log(`Permission granted for client ${keycloakClient}`);
  } catch (e) {
    throw new Error(`Error updating client permissions.\n${e}`);
  }
}

async function checkPermissions(token: string): Promise<string | undefined> {
  // check if permissions are enabled
  const clientResponse = await axios.get(`${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients`, {
    headers: { authorization: `Bearer ${token}` }
  });
  const client = clientResponse.data.filter((el: any) => {
    return el.clientId === keycloakClient;
  })[0];
  const clientPermissions = await axios.get(
    `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${client.id}/management/permissions`,
    {
      headers: { authorization: `Bearer ${token}` }
    }
  );
  if (!clientPermissions.data.enabled) {
    console.log("Client permissions not set correctly updating them now!");
    return client.id;
  }

  // check if there is a token exchange policy
  const realmManagementClient = clientResponse.data.filter((el: any) => {
    return el.clientId === "realm-management";
  })[0];
  const policyIds = await axios.get(
    `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${realmManagementClient.id}/authz/resource-server/policy`,
    {
      headers: { authorization: `Bearer ${token}` }
    }
  );
  if (policyIds.data.some((el: any) => el.name.startsWith("token-exchange.permission.client."))) {
    console.log("Client permissions configured correctly!");
    return;
  }
  console.log("Client permissions not set correctly updating them now!");
  return client.id;
}

async function updateClientConfig(client: any, token: string): Promise<void> {
  try {
    await axios.put(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${client.id}`,
      {
        standardFlowEnabled: false,
        directAccessGrantsEnabled: true,
        publicClient: true,
        webOrigins: ["*"]
      },
      {
        headers: {
          authorization: `bearer ${token}`,
          "Content-Type": "application/json" // eslint-disable-line @typescript-eslint/naming-convention
        }
      }
    );
    console.log(`Client ${keycloakClient} updated!`);
  } catch (e) {
    throw new Error(
      `Something went wrong updating the Client ${keycloakClient} 😢\nPlease make sure the Keycloakserver is running`
    );
  }
}

function isClientConfigCorrect(client: any): boolean {
  return (
    client.webOrigins.includes("*") &&
    !client.standardFlowEnabled &&
    client.directAccessGrantsEnabled &&
    client.publicClient
  );
}

async function setupClient(token: string): Promise<void> {
  try {
    await axios.post(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients`,
      {
        clientId: `${keycloakClient}`,
        standardFlowEnabled: false,
        directAccessGrantsEnabled: true,
        publicClient: true,
        webOrigins: ["*"]
      },
      {
        headers: {
          authorization: `bearer ${token}`,
          "Content-Type": "application/json" // eslint-disable-line @typescript-eslint/naming-convention
        }
      }
    );
    console.log(`Client ${keycloakClient} created!`);
  } catch (e) {
    throw new Error(
      `Something went wrong creating the Client ${keycloakClient} 😢\nPlease make sure the Keycloakserver is running`
    );
  }
}

async function isClientSetup(token: string): Promise<any> {
  try {
    let client: any;
    const clientResponse = await axios.get(`${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients`, {
      headers: { authorization: `Bearer ${token}` }
    });
    if (
      !clientResponse.data.some((el: any) => {
        if (el.clientId === keycloakClient) {
          client = el;
          return true;
        }
        return false;
      })
    ) {
      console.log(`Could not find ${keycloakClient} trying to create it!`);
      return;
    }
    console.log(`${keycloakClient} found checking the configurations now!`);
    return client;
  } catch (e) {
    throw new Error(`Something went wrong checking for ${keycloakClient}, error:\n${e}`);
  }
}

async function setupRealm(token: string): Promise<void> {
  try {
    await axios.post(
      `${keycloakBaseUrl}/admin/realms`,
      {
        realm: `${keycloakRealm}`,
        enabled: true
      },
      {
        headers: {
          authorization: `bearer ${token}`,
          "Content-Type": "application/json" // eslint-disable-line @typescript-eslint/naming-convention
        }
      }
    );
    console.log(`Realm ${keycloakRealm} created!`);
  } catch (e) {
    throw new Error(
      `Something went wrong creating the Realm ${keycloakRealm} 😢\nPlease make sure the Keycloakserver is running`
    );
  }
}

async function isRealmSetup(token: string): Promise<boolean> {
  try {
    const realm = await axios.get(`${keycloakBaseUrl}/realms/${keycloakRealm}`, {
      headers: { authorization: `Bearer ${token}` }
    });
    console.log(`Realm ${keycloakRealm} found.\nChecking if Realm is enabled.`);
    if (!realm.data.enabled) {
      console.log("Enabeling Realm.");
      await axios.put(
        `${keycloakBaseUrl}/admin/realms/${keycloakRealm}`,
        {
          enabled: true
        },
        {
          headers: {
            authorization: `bearer ${token}`,
            "Content-Type": "application/json" // eslint-disable-line @typescript-eslint/naming-convention
          }
        }
      );
    }
    console.log(`Realm enabled. Checking client ${keycloakClient}.`);
    return true;
  } catch (e) {
    console.log(`Realm ${keycloakRealm} not found!`);
    return false;
  }
}
