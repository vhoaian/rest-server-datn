import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import config from "../../../config";
import { TAG_EVENT } from "../../TAG_EVENT";

const CUSTOMER_DEFAULT = {
  id: null,
  socketID: null,
};

class CustomerController {
  private _listCustomerOnline: any = [];
  private _io: any = null;

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
    return this._io
      .of("/")
      .sockets.get(`${this.getCustomer(customerID).socketID}`);
  }

  addCustomer(customerID, socketID) {
    this._listCustomerOnline.push({ id: customerID, socketID });
  }

  removeCustomer = (customerID) => {
    const indexCus = this._listCustomerOnline.findIndex(
      (cus) => cus.id === customerID
    );
    if (indexCus < 0) return;

    this._listCustomerOnline.splice(indexCus, 1);
  };

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
