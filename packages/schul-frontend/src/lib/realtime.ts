import ioClient from "socket.io-client";
const ENDPOINT = "/";

const socket = ioClient(ENDPOINT);

export const io = socket;
