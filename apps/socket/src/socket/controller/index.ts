import { normalizeResponse } from "../../utils/normalizeResponse";
import { TAG_EVENT, TAG_LOG_ERROR } from "../TAG_EVENT";
import customerConfig from "./customer";
import merchantConfig from "./merchant";
import shipperConfig from "./shipper";

// Event joinRoom
const joinRoom = (io, socket): void => {
  socket.on(TAG_EVENT.REQUEST_JOIN_ROOM, ({ orderID }) => {
    socket.join(orderID);
    socket.emit(
      TAG_EVENT.RESPONSE_JOIN_ROOM,
      normalizeResponse(`Join room ${orderID} success`, null)
    );
  });

  socket.on(TAG_EVENT.REQUEST_LEAVE_ROOM, ({ orderID }) => {
    socket.leave(orderID);
    socket.emit(
      TAG_EVENT.RESPONSE_LEAVE_ROOM,
      normalizeResponse(`Leave room ${orderID} success`, null)
    );
  });
};

// Main config
const config = (io, socket): void => {
  // setup event listener
  joinRoom(io, socket);

  const roleUser = socket.decode.role || "none";

  switch (roleUser) {
    case "customer":
      console.log("CUSTOMER");
      customerConfig(io, socket);
      break;

    case "merchant":
      console.log("MERCHANT");
      merchantConfig(io, socket);
      break;

    case "shipper":
      console.log("SHIPPER");
      shipperConfig(io, socket);
      break;

    default:
      console.log(`[${TAG_LOG_ERROR}]: role of user invalid.`);
  }
};

export default config;
