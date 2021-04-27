import socketIO from "socket.io";
import _ from "underscore";
import configApp from "../config";
import configEventListener from "./eventListener";
import { TAG_LOG, TAG_LOG_ERROR } from "./TAG_EVENT";
import jwt from "jsonwebtoken";

const checkAuthToken = (token, callback) => {
  try {
    const decode = jwt.verify(token, configApp.JWT.secretKey);
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
          console.log(socket.decode);

          // @ts-expect-error
          _.each(_io.nsps, (nsp) => {
            if (_.findWhere(nsp.sockets, { id: socket.id })) {
              console.log(`[${TAG_LOG}]: Restoring socket to ${nsp.name}`);
              nsp.connected[socket.id] = socket;
            }
          });

          socket.emit("authenticated", "Authenticated");
        } else {
          socket.emit("unauthenticate", err.message);
        }
      });
    });

    setTimeout(() => {
      //sau 1s mà client vẫn chưa dc auth, lúc đấy chúng ta mới disconnect.
      if (!socket.auth) {
        console.log(`[${TAG_LOG}]: Disconnecting socket ${socket.id}`);
        socket.disconnect("unauthorized");
      }
    }, 1000);
  });

  // @ts-expect-error
  _.each(_io.nsps, (nsp) => {
    nsp.on("connect", (socket) => {
      if (!socket.auth) {
        console.log(`[${TAG_LOG}]: Removing socket from ${nsp.name}`);
        delete nsp.connected[socket.id];
      }
    });
  });

  console.log(`[${TAG_LOG}]: Config socket.io success`);
};
