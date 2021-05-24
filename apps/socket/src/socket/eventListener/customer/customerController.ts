import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import config from "../../../config";
import { TAG_EVENT } from "../../TAG_EVENT";

const isLog = config.LOG_SOCKET.indexOf("customer") > -1 ? true : false;

const CUSTOMER_DEFAULT = {
  id: null,
  socketID: null,
};

let listCustomerOnline: any = [];
let _io: any = null;
export const setIO = (io) => (_io = io);

// Log list customer online
if (isLog)
  setInterval(() => {
    console.log("LIST CUSTOMER ONLINE");
    console.table(listCustomerOnline);
  }, 5000);

export const getCustomer = (id) => {
  return listCustomerOnline.find((cus) => cus.id === id) || null;
};

export const addCustomer = (id, socketID) => {
  listCustomerOnline.push({ id, socketID });
};

export const removeCustomer = (id) => {
  const indexCus = listCustomerOnline.findIndex((cus) => cus.id === id);
  if (indexCus < 0) return;

  listCustomerOnline.splice(indexCus, 0);
};

export const sendStatusPaymentToCustomer = (customerID, order) => {
  const customerSocketID = getCustomer(customerID).socketID;

  _io.to(customerSocketID).emit(
    TAG_EVENT.RESPONSE_CUSTOMER_PAYMENT_ORDER,
    normalizeResponse("Payment status", {
      success: true,
      message: "Payment success",
    })
  );
};
