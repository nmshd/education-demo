import config from "config";
import express from "express";
import { Socket } from "socket.io";
import { getUser } from "./keycloakHelperFunctions";

const cookieToSocket: Map<string, Socket> = new Map();
const enmeshedAddressToSocket: Map<string, Socket> = new Map();
const socketIdToEnmeshedAddress: Map<string, string> = new Map();
const adminCookieToSocket: Map<string, Socket> = new Map();

export function getSocketFromCookie(cookie: string): Socket | undefined {
  return cookieToSocket.get(cookie);
}

export function getSocketFromEnmeshedAddress(cookie: string): Socket | undefined {
  return enmeshedAddressToSocket.get(cookie);
}

export async function checkSessionIntegrity(
  connectSId: string | undefined,
  userName: string
): Promise<{ status: number; attributes?: Record<string, any> }> {
  // It should be impossible to request session data without a session
  if (!connectSId) return { status: 500 };
  const socket = cookieToSocket.get(connectSId);

  const user = await getUser(userName);
  if (user?.attributes && socket) {
    if (user.attributes.enmeshedAddress) {
      socketIdToEnmeshedAddress.set(socket.id, user.attributes.enmeshedAddress[0]);
      enmeshedAddressToSocket.set(user.attributes.enmeshedAddress[0], socket);
    }
  }

  if (user?.roles.includes("admin") && socket) {
    adminCookieToSocket.set(connectSId, socket);
  }

  return { status: 200, attributes: user?.attributes ?? [] };
}

export function handleConnect(connectSId: string, socket: Socket): void {
  cookieToSocket.set(connectSId, socket);
}

export function handleDeprecatedSessionId(sessionId: string): void {
  cookieToSocket.delete(sessionId);
  adminCookieToSocket.delete(sessionId);
}

export function handleDisconnect(sessionId: string, socketId: string): void {
  cookieToSocket.delete(sessionId);
  adminCookieToSocket.delete(sessionId);
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

export function emitToAdminUsers(eventName: string, ...args: any[]): void {
  console.log(adminCookieToSocket);
  for (const socket of adminCookieToSocket.values()) {
    socket.emit(eventName, ...args);
  }
}
