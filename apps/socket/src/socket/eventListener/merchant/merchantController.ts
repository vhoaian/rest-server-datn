import { Order } from "@vohoaian/datn-models";
import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import config from "../../../config";
import { TAG_EVENT, TAG_LOG_ERROR } from "../../TAG_EVENT";
import * as orderController from "../order";

const MERCHANT_DEFAULT = {
  id: null,
  socketID: null,
  listOrderID: [],
};

let listMetchantOnline: any = [];
let _io: any = null;
export const setIO = (io) => {
  _io = io;
};

// Log list customer online
if (config.LOG_SOCKET.indexOf("merchant") > -1)
  setInterval(() => {
    console.log("LIST MERCHANT ONLINE");
    console.table(listMetchantOnline);
  }, 5000);

export const getMerchant = (id): any => {
  return listMetchantOnline.find((merchant) => merchant.id === id) || null;
};

export const addMerchant = (id, socketID) => {
  // @ts-expect-error
  listMetchantOnline.push({ ...MERCHANT_DEFAULT.clone(), id, socketID });
};

export const removeMerchant = (id) => {
  listMetchantOnline = listMetchantOnline.filter(
    (merchant) => merchant.id !== id
  );
};

export const sendOrderToMerchant = (merchantID, order) => {
  const socketMerchantID: string = getMerchant(merchantID).socketID;
  _io
    .to(socketMerchantID)
    .emit(
      TAG_EVENT.RESPONSE_MERCHANT_CONFIRM_ORDER,
      normalizeResponse("Server request confirm order", order)
    );

  _io.of("/").sockets.get(`${socketMerchantID}`).join(order.id);
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
export const cancelOrder = (orderID, merchantID): Promise<boolean> => {
  return orderController.changeStatusOrder(
    orderID,
    merchantID,
    orderController.ORDER_STATUS.CANCEL_BY_MERCHANT
  );
};
