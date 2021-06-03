import { TAG_EVENT } from "../../TAG_EVENT";
import orderController from "../order";
import customerController from "./customerController";
import chatController from "../chat";

// Config for customer
const customerConfig = (io, socket) => {
  customerController.addCustomer(socket.decode.id, socket.id);

  socket.on("disconnect", () => {
    customerController.removeCustomer(socket.decode.id);
  });

  socket.on("new order", ({ restaurantID, orderID }) => {
    orderController.addOrder(orderID);
  });

  socket.on(TAG_EVENT.REQUEST_CUSTOMER_CANCEL_ORDER, ({ orderID }) => {
    // console.log(`CUSTOMER CANCEL ORDER ${orderID}`);
    orderController.changeStatusOrder(
      orderID,
      socket.decode.id,
      orderController.ORDER_STATUS.CANCEL_BY_CUSTOMER
    );
  });

  socket.on(TAG_EVENT.REQUEST_CHAT, ({ roomID, message }) => {
    chatController.sendMessage(roomID, "customer", message);
  });
};

export default customerConfig;
