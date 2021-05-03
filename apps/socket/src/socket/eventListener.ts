import { TAG_EVENT, TAG_LOG_ERROR, TAG_LOG } from "./TAG_EVENT";
import * as orderController from "./order";
import * as shipperController from "./shipper";
import * as merchantController from "./merchant";
import * as customerController from "./customer";

const joinRoom = (io, socket) => {
  socket.on(TAG_EVENT.REQUEST_JOIN_ROOM, ({ orderID }) => {
    socket.join(orderID);
    socket.emit(TAG_EVENT.RESPONSE_JOIN_ROOM, {});
  });

  socket.on(TAG_EVENT.REQUEST_LEAVE_ROOM, ({ orderID }) => {
    socket.leave(orderID);
  });
};

const shipperConfig = (io, socket) => {
  shipperController.addShipper(socket.decode.id, socket.id, { lat: 0, lng: 0 });

  socket.on(TAG_EVENT.REQUEST_SHIPPER_CHANGE_COOR, ({ coor }) => {
    shipperController.updateShipperCoor(socket.decode.id, coor);

    const roomID = orderController.getOrderByShipperID(socket.decode.id);
    socket.to(roomID).emit(TAG_EVENT.RESPONSE_SHIPPER_CHANGE_COOR, { coor });
  });

  socket.on(TAG_EVENT.REQUEST_SHIPPER_CONFIRM_ORDER, () => {});

  socket.on("disconnect", () => {
    shipperController.removeShipper(socket.decode.id);
  });
};

const merchantConfig = (io, socket) => {
  merchantController.addMerchant(socket.deocde.id, socket.id);

  socket.on(TAG_EVENT.REQUEST_MERCHANT_CONFIRM_ORDER, async ({ orderID }) => {
    try {
      // Change status order
      await orderController.changeStatusOrder(
        orderID,
        orderController.ORDER_STATUS.MERCHANT_CONFIRM
      );

      // Send order to shipper

      // Send status order to customer
      socket
        .to(orderID)
        .emit(TAG_EVENT.RESPONSE_CHANGE_STATUS_ROOM, { orderID, status });
    } catch (error) {
      socket.to(orderID).emit("error", { message: error.message });
    }
  });

  socket.on("disconnect", () => {
    merchantController.removeMerchant(socket.decode.id);
  });
};

const customerConfig = (io, socket) => {
  customerController.addCustomer(socket.decode.id, socket.id);
  socket.on("disconnect", () => {
    customerController.removeCustomer(socket.decode.id);
  });
};

const config = (io, socket) => {
  joinRoom(io, socket);

  const roleUser = socket.decode.role;

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
