import config from "config";
import express from "express";
import path from "path";
import { EnmeshedLoginDemoServer } from "./EnmeshedLoginDemoServer";
import { PrivateRouter } from "./routing/PrivateRouter";
import { PrivateRoutes } from "./routing/PrivateRoutes";
import { PublicRouter } from "./routing/PublicRouter";
import { PublicRoutes } from "./routing/PublicRoutes";
import {
  extractSessionId,
  getSocketFromCookie,
  handleConnect,
  handleDeprecatedSessionId
} from "./routing/sessionHelper";

export function configRouting(s: EnmeshedLoginDemoServer): void {
  const publicRouter = new PublicRouter();
  publicRouter.initialize();
  // If there are additional Public Routes in ./routing/PublicRoutes.ts add them here like
  // publicRouter.router.get("xxx", PublicRoutes.xxx);
  publicRouter.router.get("/registrationQR", PublicRoutes.registrationQR);
  publicRouter.router.get("/onboardingQR", PublicRoutes.onboardingQR);
  publicRouter.router.post("/webhooks/enmeshed/relationship", PublicRoutes.handleEnmeshedRelationshipWebhook);
  publicRouter.router.post("/webhooks/enmeshed/requestChanged", PublicRoutes.handleEnmeshedRequestChanged);
  publicRouter.router.post("/register", PublicRoutes.handleRegularRegistration);
  publicRouter.router.get("/config", PublicRoutes.getSiteConfig);
  publicRouter.router.get("/keycloakConfig", PublicRoutes.getKeycloakConfig);
  publicRouter.router.post("/sendMessage", PublicRoutes.sendMessage);

  s.app.use("/api/v1", publicRouter.router);

  // If the session get's overriden by a successful login attempt, we need to update our socket maps to still be able to find them by session.
  s.app.use(function (req, res, next) {
    res.on("finish", () => {
      if (res.hasHeader("Set-Cookie")) {
        const newSession = res.getHeader("Set-Cookie");
        const sessionString = newSession?.toString();
        const oldSession = extractSessionId(req);

        if (sessionString?.includes(config.get("server.session.name")) && oldSession) {
          const socket = getSocketFromCookie(oldSession);
          if (socket) {
            const pairs = sessionString.split(";");
            const splittedPairs = pairs.filter((el) => el.includes("=")).map((cookie) => cookie.split("="));
            const cookieObj = splittedPairs.reduce(function (obj: any, cookie) {
              obj[decodeURIComponent(cookie[0].trim())] = decodeURIComponent(cookie[1].trim());
              return obj;
            }, {});
            const newSession = cookieObj[`${config.get("server.session.name")}`];

            handleDeprecatedSessionId(oldSession);
            handleConnect(newSession, socket);
          }
        }
      }
    });
    next();
  });

  const privateRouter = new PrivateRouter();
  privateRouter.initialize();
  // If there are additional Private Routes in ./routing/PrivateRoutes.ts add them here like
  // privateRouter.router.get("xxx", PrivateRoutes.xxx);
  privateRouter.router.post("/sendApplicationRequest", PrivateRoutes.sendApplicationRequest);
  privateRouter.router.post("/sendDemoMessageToUser", PrivateRoutes.sendMessageToUser);

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
