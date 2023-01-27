import config from "config";
import { Router } from "express";
import passport from "passport";
// @ts-expect-error no typescript definitions available
import KeycloakBearerStrategy from "passport-keycloak-bearer";
import { checkSessionIntegrity, extractSessionId } from "./sessionHelper";

export class PrivateRouter {
  public router: Router;
  public isInitialized: boolean;

  public constructor() {
    this.router = Router();
    this.isInitialized = false;
  }

  private setupMiddleware() {
    this.router.use(passport.initialize());
    this.router.use(passport.authenticate("session"));

    passport.use(
      new KeycloakBearerStrategy({
        realm: config.get("keycloak.realm"),
        url: config.get("keycloak.baseUrl")
      })
    );
    passport.serializeUser(function (user, done) {
      done(null, user);
    });
    passport.deserializeUser(function (user: any, done) {
      if (!user) {
        done("Error");
      }
      done(null, user);
    });
  }

  public initialize(): void {
    if (!this.isInitialized) {
      this.setupMiddleware();

      this.router.post("/login", passport.authenticate("keycloak", { session: true }), async function (req, res) {
        const connectSId = extractSessionId(req);
        req.session.user = req.user;
        const result = await checkSessionIntegrity(connectSId, req.session.user.preferred_username);
        if (result.status === 500) return res.sendStatus(500);
        req.session.user.attributes = result.attributes;
        res.status(200).send(req.user);
      });

      this.router.use(passport.authenticate("session"), function (req, res, next) {
        if (!req.session.user) {
          return next({ status: 401 });
        }
        next();
      });

      this.router.post("/logout", function (req, res) {
        req.session.user = undefined;
        res.redirect("/");
      });
    }
  }
}
