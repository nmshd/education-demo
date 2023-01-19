import config from "config";
import express from "express";
import path from "path";
import { EnmeshedLoginDemoServer } from "./EnmeshedLoginDemoServer";
import { PrivateRouter } from "./routing/PrivateRouter";
import { PrivateRoutes } from "./routing/PrivateRoutes";
import { PublicRouter } from "./routing/PublicRouter";
import { PublicRoutes } from "./routing/PublicRoutes";

export function configRouting(s: EnmeshedLoginDemoServer): void {
  const publicRouter = new PublicRouter();
  publicRouter.initialize();
  // If there are additional Public Routes in ./routing/PublicRoutes.ts add them here like
  // publicRouter.router.get("xxx", PublicRoutes.xxx);
  publicRouter.router.get("/registrationQR", PublicRoutes.registrationQR);
  publicRouter.router.get("/onboardingQR", PublicRoutes.onboardingQR);
  publicRouter.router.post("/webhooks/enmeshed/relationship", PublicRoutes.handleEnmeshedRelationshipWebhook);
  publicRouter.router.post("/register", PublicRoutes.handleRegularRegistration);
  publicRouter.router.get("/nmshdUserLogin", PublicRoutes.loginWithEnmeshed);
  publicRouter.router.get("/config", PublicRoutes.getSiteConfig);
  publicRouter.router.get("/keycloakConfig", PublicRoutes.getKeycloakConfig);
  publicRouter.router.post("/sendMessage", PublicRoutes.sendMessage);

  s.app.use("/api/v1", publicRouter.router);

  const privateRouter = new PrivateRouter();
  privateRouter.initialize();
  // If there are additional Private Routes in ./routing/PrivateRoutes.ts add them here like
  // privateRouter.router.get("xxx", PrivateRoutes.xxx);
  privateRouter.router.post("/genericDB", PrivateRoutes.writeInDb);
  privateRouter.router.get("/genericDB", PrivateRoutes.readFromDb);
  privateRouter.router.delete("/genericDB", PrivateRoutes.deleteFromDb);
  privateRouter.router.patch("/genericDB", PrivateRoutes.updateDb);

  s.app.use("/api/v1/auth", privateRouter.router);

  s.app.use(express.static(path.resolve(config.get("server.publicDirectory"))));

  s.app.use((_req, res) => {
    res.status(404).send("Uhpsieee");
  });

  s.app.use((error: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      console.log("Headers already sent. Calling next(error)...");
      return next(error); // Delegate to default error handler to abort stream processing
    }
    console.log(error);
    res.sendStatus(error?.status ?? 500);
  });
}
