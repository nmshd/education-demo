import config from "config";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import session from "express-session";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { configRouting } from "./routing";
import { extractSessionId, handleConnect, handleDisconnect } from "./routing/sessionHelper";

interface ServerToClientEvents {
  scanned(): void;
}

interface ClientToServerEvents {}

declare module "express-session" {
  export interface SessionData {
    user: any;
  }
}

export class EnmeshedLoginDemoServer {
  public session: any;
  public http: http.Server;
  public app: Express;
  public io: Server;
  public store: any = MongoStore.create({
    mongoUrl: config.get("mongodb.connectionString")
  });
  public db: any;

  public static async create(): Promise<EnmeshedLoginDemoServer> {
    const server = new EnmeshedLoginDemoServer();
    await server.configure();
    configRouting(server);

    return server;
  }

  public async configure(): Promise<void> {
    this.app = express();
    this.http = http.createServer(this.app);
    this.db = await mongoose.connect(config.get("mongodb.connectionString"));
    this.io = new Server<ClientToServerEvents, ServerToClientEvents>(this.http, {
      cors: {
        origin: true,
        methods: ["GET", "POST", "DELETE", "PATCH"],
        credentials: true
      }
    });

    this.configIO();

    this.app.set("trust proxy", 1); // Trust the first proxy

    if (config.has("server.session")) {
      this.session = session({
        store: this.store,
        secret: config.get("server.session.secret"),
        name: config.get("server.session.name"),
        resave: true,
        cookie: { maxAge: 60000000000000 }
      });
      this.app.use(this.session);
    }

    this.app.use(cookieParser());

    if (config.has("server.cors")) {
      this.app.use(cors(config.get("server.cors")));
    }

    this.app.use(express.json({ limit: "20mb" }));
  }

  public configIO(): void {
    this.io.on("connection", (socket) => {
      const connectSId = extractSessionId(socket.request as express.Request);
      if (connectSId) {
        handleConnect(connectSId, socket);
      }

      socket.on("disconnect", function () {
        if (connectSId) {
          handleDisconnect(connectSId, socket.id);
        }
      });
    });
  }

  public launch(): void {
    const port = this.determinePort();

    this.http.listen(port, () => {
      console.log(`Listening on Port: ${port}`);
    });
  }

  private determinePort(): number {
    let port = -1;

    if (config.has("server.port")) port = config.get("server.port");

    try {
      if (process.env.PORT) port = parseInt(process.env.PORT);
    } catch (e) {
      // error is handled later
    }

    if (port < 0) {
      throw new Error(
        "Port is not set for start() and there is no default port set via 'server.port' config or PORT environment variable."
      );
    }

    return port;
  }
}
