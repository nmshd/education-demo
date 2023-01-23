import config from "config";
import express from "express";
import { Socket } from "socket.io";

const cookieToSocket: Map<string, Socket> = new Map();
const enmeshedAddressToSocket: Map<string, Socket> = new Map();
const socketIdToEnmeshedAddress: Map<string, string> = new Map();

export function getSocketFromCookie(cookie: string): Socket | undefined {
  return cookieToSocket.get(cookie);
}

export function handleConnect(connectSId: string, socket: Socket): void {
  cookieToSocket.set(connectSId, socket);
}

export function handleDisconnect(sessionId: string, socketId: string): void {
  cookieToSocket.delete(sessionId);
  const enmeshedAddress = socketIdToEnmeshedAddress.get(socketId);
  if (enmeshedAddress) {
    enmeshedAddressToSocket.delete(enmeshedAddress);
    socketIdToEnmeshedAddress.delete(socketId);
  }
}

export function extractSessionId(req: express.Request): string | undefined {
  const cookieString = req.headers.cookie;
  if (!cookieString) return undefined;
  const pairs = cookieString.split(";");
  const splittedPairs = pairs.map((cookie) => cookie.split("="));

  const cookieObj = splittedPairs.reduce(function (obj: any, cookie) {
    obj[decodeURIComponent(cookie[0].trim())] = decodeURIComponent(cookie[1].trim());
    return obj;
  }, {});

  return cookieObj[`${config.get("server.session.name")}`];
}
