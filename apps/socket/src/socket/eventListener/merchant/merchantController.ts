import { Order } from "@vohoaian/datn-models";
import config from "../../../config";
import { TAG_EVENT, TAG_LOG_ERROR } from "../../TAG_EVENT";
import * as orderController from "../order";

const MERCHANT_DEFAULT = {
  id: null,
  socketID: null,
  listOrderID: [],
};

let listMetchantOnline = [];
let _io = null;
export const setIO = (io) => {
  _io = io;
};

// Log list customer online
if (config.LOG_SOCKET.indexOf("merchant") > -1)
  setInterval(() => {
    console.log("LIST MERCHANT ONLINE");
    console.table(listMetchantOnline);
  }, 5000);

export const getMerchant = (id) => {
  // @ts-expect-error
  const indexOf = listMetchantOnline.map((merchant) => merchant.id).indexOf(id);
  if (indexOf < 0) return null;

  return listMetchantOnline[indexOf];
};

export const addMerchant = (id, socketID) => {
  // @ts-expect-error
  listMetchantOnline.push({ ...MERCHANT_DEFAULT.clone(), id, socketID });
};

export const removeMerchant = (id) => {
  const newListMetchantOnline = listMetchantOnline.filter((merchant) => {
    // @ts-expect-error
    return merchant.id !== id ? merchant : null;
  });

  listMetchantOnline = newListMetchantOnline;
};

// Merchant confirm order
export const confirmOrder = (orderID, merchantID) => {
  // Update status order
  return orderController.changeStatusOrder(
    orderID,
    merchantID,
    orderController.ORDER_STATUS.MERCHANT_CONFIRM
  );
};

// Merchant cancel order
export const cancelOrder = (orderID, merchantID) => {
  return orderController.changeStatusOrder(
    orderID,
    merchantID,
    orderController.ORDER_STATUS.CANCEL_BY_MERCHANT
  );
};
