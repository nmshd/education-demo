import { EnmeshedLoginDemoServer } from "./EnmeshedLoginDemoServer";

async function startServer() {
  const server = await EnmeshedLoginDemoServer.create();
  server.launch();
}

startServer()
  .then()
  .catch((e) => {
    console.error(e);
  });
