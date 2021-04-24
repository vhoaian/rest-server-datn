import { Order } from "@vohoaian/datn-models";
import { TAG_LOG_ERROR } from "../TAG_EVENT";

const ORDER_STATUS = {
  WAITING: 0,
  COMING_TO_GET: 1,
  SHIPPING: 2,
  DELIVERED: 3,
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

export const getOrder = (id) => {
  // @ts-expect-error
  const indexOf = listOrderOnline.map((order) => order.id).indexOf(id);
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
    return true;
  } catch (e) {
    console.log(`[${TAG_LOG_ERROR}]: ${e.message}`);
    return false;
  }
};
