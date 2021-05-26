import jwt from "jsonwebtoken";
import socketIO from "socket.io";
import _ from "underscore";
import configApp from "../config";
import configEventListener from "./eventListener";
import orderController from "./eventListener/order";
import shipperController from "./eventListener/shipper/shipperController";
import merchantController from "./eventListener/merchant/merchantController";
import customerController from "./eventListener/customer/customerController";
import { TAG_LOG, TAG_LOG_ERROR } from "./TAG_EVENT";

// Deep copy array
// @ts-expect-error
Array.prototype.clone = function () {
  return JSON.parse(JSON.stringify(this));
};

// Deep copy object
// @ts-expect-error
Object.prototype.clone = function () {
  return JSON.parse(JSON.stringify(this));
};

// Check authenticate
const checkAuthToken = (token, callback): void => {
  try {
    const decode: any = jwt.verify(token, configApp.JWT.secretKey);

    if (decode.exp < Math.floor(new Date().getTime() / 1000))
      return callback(new Error("Token expired"), null);

    callback(null, decode);
  } catch (e) {
    callback(e, null);
  }
};

// Setup for each connection
const setUpConnection = (socket): void => {
  socket.auth = false;
  socket.on("authenticate", (data) => {
    checkAuthToken(data.token, (err, decode) => {
      if (!err && decode) {
        console.log(`[${TAG_LOG}]: Authenticated socket ${socket.id}`);
        socket.auth = true;
        socket.decode = decode;

        // If this socket is authenticated, we will call function configEventListener for config socket event listener.
        configEventListener(_io, socket);

        _.each(_io.nsps, (nsp) => {
          if (_.findWhere(nsp.sockets, { id: socket.id })) {
            console.log(`[${TAG_LOG}]: Restoring socket to ${nsp.name}`);
            nsp.connected[socket.id] = socket;
          }
        });

        // Invoke event authenticated
        socket.emit("authenticated", "Authenticated");
      } else {
        // Invoke event unauthenticated
        socket.emit("unauthenticated", err.message);
        console.log(`[${TAG_LOG_ERROR}]: ${err.message}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[${TAG_LOG}_DISCONNECT]: ${socket.id} disconnect.`);
    });
  });

  setTimeout(() => {
    // After 5 seconds, if user is still not connected, we will disconnect this socket and invoke event unauthenticated.
    if (!socket.auth) {
      // socket.disconnect("unauthenticated");
    }
  }, 5000);
};

// Storage io
let _io: any = null;
export const getIO = (): any => _io;

// Config socket server
export const config = (server): void => {
  if (_io !== null) return;

  // @ts-expect-error
  _io = socketIO(server, {
    cors: true,
    origins: [`${configApp.URL_SERVER}:${configApp.PORT}`],
  });

  orderController.setIO(_io);
  shipperController.setIO(_io);
  merchantController.setIO(_io);
  customerController.setIO(_io);

  _io.on("connection", setUpConnection);

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
