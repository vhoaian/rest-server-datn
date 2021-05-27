import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import config from "../../../config";
import { TAG_EVENT, TAG_LOG_ERROR } from "../../TAG_EVENT";
import orderController from "../order";

const CUSTOMER_DEFAULT = {
  id: null,
  socketID: null,
  selfDestruct: null,
};

class CustomerController {
  private _listCustomerOnline: any = [];
  private _io: any = null;
  private MAXIMUM_TIME_DESTRUCT: number = 10 * 1000;

  constructor() {
    if (config.LOG_SOCKET.indexOf("customer") > -1 ? true : false)
      setInterval(() => {
        console.log("LIST CUSTOMER ONLINE");
        console.table(this._listCustomerOnline);
      }, 5000);
  }

  setIO(io) {
    this._io = io;
  }

  getCustomer(customerID): any {
    return (
      this._listCustomerOnline.find((cus) => cus.id === `${customerID}`) || null
    );
  }

  getSocket(customerID) {
    const customer = this.getCustomer(`${customerID}`);
    if (!customer) return null;

    return this._io.of("/").sockets.get(`${customer.socketID}`);
  }

  addCustomer(customerID, socketID) {
    const customer: any = this.getCustomer(customerID);
    if (customer) {
      console.log("CUSTOMER RECONNECT");
      customer.socketID = socketID;
      clearTimeout(customer.selfDestruct);
      customer.selfDestruct = null;
    } else {
      this._listCustomerOnline.push({ id: customerID, socketID });
    }

    // send all order if merchant has order before
    const listOrder = orderController
      .getOrderByCustomerID(customerID)
      .map((order) => ({ ...order, id: order.orderID }));
    if (listOrder.length === 0) return;

    // join room
    const socketCustomer = this.getSocket(customerID);
    listOrder.forEach((odr) => socketCustomer.join(odr.id));

    socketCustomer.emit(
      TAG_EVENT.RESPONSE_CUSTOMER_RECONNECT,
      normalizeResponse("Reconnect", { listOrder })
    );
  }

  removeCustomer = (customerID) => {
    const customer = this.getCustomer(customerID);
    if (!customer)
      return console.log(
        `[${TAG_LOG_ERROR}_REMOVE_CUSTOMER]: customer does not exits`
      );

    orderController.getOrderByMerchantID(customerID).forEach((order) => {
      orderController.getSocket(order.orderID).emit(
        TAG_EVENT.RESPONSE_DISCONNECT_ROOM,
        normalizeResponse("Merchant disconnect", {
          orderID: order.orderID,
          customerID: customerID,
        })
      );
    });

    // Set timeout to seft destruct
    customer.selfDestruct = setTimeout(() => {
      this.handleCustomerDisconnect(customerID);
    }, this.MAXIMUM_TIME_DESTRUCT);
  };

  private handleCustomerDisconnect(id) {
    // Delete customer
    const index = this._listCustomerOnline.findIndex(
      (customer) => customer.id === id
    );
    this._listCustomerOnline.splice(index, 1);
  }

  sendStatusPaymentToCustomer = (customerID, order) => {
    this.getSocket(customerID).emit(
      TAG_EVENT.RESPONSE_CUSTOMER_PAYMENT_ORDER,
      normalizeResponse("Payment status", {
        success: true,
        message: "Payment success",
      })
    );
  };
}

const customerController = new CustomerController();
export default customerController;
