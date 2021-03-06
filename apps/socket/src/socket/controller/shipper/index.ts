import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import { TAG_EVENT } from "../../TAG_EVENT";
import shipperController from "./shipperController";
import chatController from "../chat";

// Config for shipper
const shipperConfig = (io, socket) => {
  shipperController.addShipper(socket.decode.id, socket.id, {
    lat: 0,
    lng: 0,
  });

  socket.on(TAG_EVENT.REQUEST_SHIPPER_CHANGE_COOR, ({ coor }) => {
    shipperController.updateShipperCoor(socket.decode.id, coor);
  });

  socket.on(TAG_EVENT.REQUEST_SHIPPER_CONFIRM_ORDER, ({ orderID }) => {
    const isConfirmSuccess = shipperController.confirmOrder(
      orderID,
      socket.decode.id
    );

    if (isConfirmSuccess) {
      socket.emit(
        TAG_EVENT.RESPONSE_JOIN_ROOM,
        normalizeResponse(`Join room ${orderID} success`, null)
      );
    } else {
      socket.leave(orderID);
    }
  });

  socket.on(TAG_EVENT.REQUEST_SHIPPER_SKIP_ORDER, ({ orderID }) => {
    shipperController.skipOrder(orderID, socket.id);
  });

  socket.on(TAG_EVENT.REQUEST_SHIPPER_CANCEL_ORDER, ({ orderID }) => {
    shipperController.cancelOrder(orderID, socket.decode.id);
  });

  socket.on(TAG_EVENT.REQUEST_SHIPPER_TOOK_FOOD, ({ orderID }) => {
    shipperController.tookFood(orderID, socket.decode.id);
  });

  socket.on(TAG_EVENT.REQUEST_SHIPPER_DELIVERED, ({ orderID }) => {
    shipperController.deliveredOrder(orderID, socket.decode.id);
  });

  socket.on("disconnect", () => {
    shipperController.removeShipper(socket.decode.id);
  });

  socket.on(TAG_EVENT.REQUEST_CHAT, ({ roomID, message }) => {
    chatController.sendMessage(roomID, "shipper", message);
  });
};

export default shipperConfig;
