import { Order } from "@vohoaian/datn-models";
import { TAG_LOG_ERROR } from "../TAG_EVENT";
import config from "../../config";

const isLog = config.LOG_SOCKET.indexOf("order") > -1 ? true : false;

const ENUM = (function* () {
  var index = 0;
  while (true) yield index++;
})();

export const ORDER_STATUS = {
  WAITING: ENUM.next().value,
  MERCHANT_CONFIRM: ENUM.next().value,
  SHIPPER_ARRIVED: ENUM.next().value,
  DURING_GET: ENUM.next().value,
  DURING_SHIP: ENUM.next().value,
  DELIVERED: ENUM.next().value,
};

const ORDER_DEFAULT = {
  orderID: null,
  shipperID: null,
  customerID: null,
  merchantID: null,
  status: null,
};

const newOrder = (orderID, customerID, merchantID, shipperID) => ({
  orderID,
  shipperID,
  customerID,
  merchantID,
  status: ORDER_STATUS.WAITING,
});

let listOrderOnline = [];

// Log list customer online
if (isLog)
  setInterval(() => {
    console.log("LIST ORDER ONLINE");
    console.table(listOrderOnline);
  }, 5000);

export const getOrderByID = (id) => {
  // @ts-expect-error
  const indexOf = listOrderOnline.map((order) => order.id).indexOf(id);
  if (indexOf < 0) return null;

  return listOrderOnline[indexOf];
};

export const getOrderByShipperID = (shipperID) => {
  const indexOf = listOrderOnline
    // @ts-expect-error
    .map((order) => order.shipperID)
    .indexOf(shipperID);
  if (indexOf < 0) return null;

  return listOrderOnline[indexOf];
};

export const addOrder = (orderID, customerID, merchantID, shipperID) => {
  // @ts-expect-error
  listOrderOnline.push(newOrder(orderID, customerID, merchantID, shipperID));
};

export const removeOrder = (id) => {
  const newListOrderOnline = listOrderOnline.filter((order) => {
    // @ts-expect-error
    return order.id !== id ? order : null;
  });

  listOrderOnline = newListOrderOnline;
};

export const changeStatusOrder = async (_id, status) => {
  try {
    const newOrder = await Order.findOneAndUpdate({ _id }, { Status: status });
    return null;
  } catch (e) {
    console.log(`[${TAG_LOG_ERROR}]: ${e.message}`);
    throw e;
  }
};
