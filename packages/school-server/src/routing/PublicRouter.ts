import { Router } from "express";
import path from "path";

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
      this.isInitialized = true;
    }
  }
}
