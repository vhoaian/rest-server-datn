import jwt from "jsonwebtoken";
import socketIO from "socket.io";
import _ from "underscore";
import configApp from "../config";
import configEventListener from "./eventListener";
import { TAG_LOG, TAG_LOG_ERROR } from "./TAG_EVENT";

const checkAuthToken = (token, callback) => {
  try {
    const decode = jwt.verify(token, configApp.JWT.secretKey);

    // @ts-expect-error
    if (decode.exp < Math.floor(new Date().getTime() / 1000))
      return callback(new Error("Token expired"), null);

    callback(null, decode);
  } catch (e) {
    callback(e, null);
  }
};

// Save io
let _io = null;
export const getIO = () => _io;

// Config socket server
export const config = (server) => {
  if (_io !== null) return;

  // @ts-expect-error
  _io = socketIO(server, {
    cors: true,
    origins: [`${configApp.URL_SERVER}:${configApp.PORT}`],
  });

  // @ts-expect-error
  _io.on("connection", (socket) => {
    socket.auth = false;
    socket.on("authenticate", (data) => {
      checkAuthToken(data.token, (err, success) => {
        if (!err && success) {
          console.log(`[${TAG_LOG}]: Authenticated socket ${socket.id}`);
          socket.auth = true;
          socket.decode = success;

          configEventListener(_io, socket);

          // @ts-expect-error
          _.each(_io.nsps, (nsp) => {
            if (_.findWhere(nsp.sockets, { id: socket.id })) {
              console.log(`[${TAG_LOG}]: Restoring socket to ${nsp.name}`);
              nsp.connected[socket.id] = socket;
            }
          });

          // Notify client authentiacte success
          socket.emit("authenticated", "Authenticated");
        } else {
          // Notify client authentiacte fail
          socket.emit("unauthenticate", err.message);
          console.log(`[${TAG_LOG_ERROR}]: ${err.message}`);
        }
      });

      socket.on("disconnect", () => {
        console.log(`[${TAG_LOG}_DISCONNECT]: ${socket.id} disconnect.`);
      });
    });

    setTimeout(() => {
      // sau 5s mà client vẫn chưa dc auth, lúc đấy chúng ta mới disconnect.
      if (!socket.auth) {
        // socket.disconnect("unauthenticate");
      }
    }, 5000);
  });

  // @ts-expect-error
  _.each(_io.nsps, (nsp) => {
    nsp.on("connect", (socket) => {
      console.log(socket.id);
      if (!socket.auth) {
        console.log(`[${TAG_LOG}]: Removing socket from ${nsp.name}`);
        delete nsp.connected[socket.id];
      }
    });
  });

  console.log(`[${TAG_LOG}]: Config socket.io success`);
};
