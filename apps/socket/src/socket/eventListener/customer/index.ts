import * as customerController from "./customerController";
import * as orderController from "../order";
import { TAG_EVENT } from "../../TAG_EVENT";

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
};

export default customerConfig;
