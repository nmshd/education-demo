import { Router } from "express";
import path from "path";
import { checkSessionIntegrity, extractSessionId } from "./sessionHelper";

export class PublicRouter {
  public router: Router;
  public isInitialized: boolean;

  public constructor() {
    this.router = Router();
    this.isInitialized = false;
  }

  public initialize(): void {
    if (!this.isInitialized) {
      this.router.get("/", function (_req, res) {
        res.sendFile(path.resolve("public", "index.html"));
      });
      this.router.get("/session", async function (req, res) {
        const connectSId = extractSessionId(req);

        if (req.session.user) {
          const result = await checkSessionIntegrity(connectSId, req.session.user.preferred_username);
          if (result.status === 500) return res.sendStatus(500);
          res.send(req.session.user);
        } else {
          res.send({});
        }
      });
      this.isInitialized = true;
    }
  }
}
