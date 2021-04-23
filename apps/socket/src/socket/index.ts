import socketIO from "socket.io";
import configApp from "../config";
import configEventListener from "./eventListener";
import { TAG_LOG, TAG_LOG_ERROR } from "./TAG_EVENT";

// Save io
let _io = null;
export const getIO = () => _io;

// Config socket server
export const config = (server) => {
  if (_io !== null) return;

  // @ts-expect-error
  _io = socketIO(server, {
    cors: true,
    origins: [`${configApp.URL_SERVER}:${process.env.PORT}`],
  });

  // @ts-expect-error
  _io.on("connection", (socket) => {
    console.log(`[${TAG_LOG}]: new connection ${socket.id}`);

    // Set listener
    configEventListener(_io, socket);

    // disconnect
    socket.on("disconnect", async () => {
      console.log(`[${TAG_LOG}]: disconnect ${socket.id}`);
    });
  });

  console.log(`[${TAG_LOG}]: Config socket.io success`);
};
