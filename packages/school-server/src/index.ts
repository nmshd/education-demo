import { EnmeshedLoginDemoServer } from "./EnmeshedLoginDemoServer";
import { setupKeycloak } from "./setupKeycloak";

async function startServer() {
  await setupKeycloak();
  console.log("Keycloak setup complete 🌈\nlaunching Server 🚀");
  const server = await EnmeshedLoginDemoServer.create();
  server.launch();
}

startServer()
  .then()
  .catch((e) => {
    console.error(e);
  });
