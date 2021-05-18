import { Order } from "@vohoaian/datn-models";
import { TAG_EVENT, TAG_LOG_ERROR } from "../../TAG_EVENT";
import config from "../../../config";
import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import { getMerchant } from "../merchant/merchantController";
import { getShipper, sendOrderToShipper } from "../shipper/shipperController";

// Helper function to generate Number
const ENUM = (function* () {
  var index = 0;
  while (true) yield index++;
})();

export const ORDER_STATUS = {
  WAITING: ENUM.next().value,
  MERCHANT_CONFIRM: ENUM.next().value,
  DURING_GET: ENUM.next().value,
  // SHIPPER_ARRIVED: ENUM.next().value,
  DURING_SHIP: ENUM.next().value,
  DELIVERED: ENUM.next().value,
  CANCEL_BY_CUSTOMER: ENUM.next().value,
  CANCEL_BY_MERCHANT: ENUM.next().value,
  CANCEL_BY_SHIPPER: ENUM.next().value,
};

const ORDER_DEFAULT = {
  orderID: null,
  shipperID: null,
  customerID: null,
  merchantID: null,
  listShippersAreRequestedLv1: [],
  listShippersAreRequestedLv2: [],
  status: ORDER_STATUS.WAITING,
};

const createOrder = (orderID, customerID, merchantID, shipperID): any => {
  return {
    // @ts-expect-error
    ...ORDER_DEFAULT.clone(),
    orderID,
    shipperID,
    customerID,
    merchantID,
  };
};

let _listOrder: any = [];
let _io: any = null;
export const setIO = (io) => {
  _io = io;
};

// Log list customer online
if (config.LOG_SOCKET.indexOf("order") > -1)
  setInterval(() => {
    console.log("LIST ORDER ONLINE");
    console.table(_listOrder);
  }, 5000);

export const getOrderByID = (id) => {
  const indexOf = _listOrder.map((order) => order.orderID).indexOf(id);
  if (indexOf < 0) return null;

  return _listOrder[indexOf];
};

export const getOrderByShipperID = (shipperID) => {
  return _listOrder.filter((order) =>
    order.shipperID === shipperID ? order : null
  );
};

export const addOrder = async (orderID, customerID, merchantID, shipperID) => {
  _listOrder.push(createOrder(orderID, customerID, merchantID, shipperID));

  const socketMerchantID: any = getMerchant(merchantID).socketID;

  // const order = await Order.findOne({ _id: orderID });
  const order = {
    id: orderID,
    coor: { lat: 0, lng: 0 },
    status: ORDER_STATUS.WAITING,
  };

  _io
    .to(socketMerchantID)
    .emit(
      TAG_EVENT.RESPONSE_MERCHANT_CONFIRM_ORDER,
      normalizeResponse("Server request confirm order", order)
    );
};

const removeOrder = (id) => {
  console.log(id);
  const indexOrder = _listOrder.findIndex((order) => order.orderID === id);
  _listOrder.splice(indexOrder, 1);
};

export const changeStatusOrder = async (orderID, userID, status) => {
  console.log(`Change status order: ${orderID}`);
  // check order
  const indexOfOrder = _listOrder
    .map((order) => order.orderID)
    .indexOf(orderID);

  if (indexOfOrder < 0) {
    console.log(`[${TAG_LOG_ERROR}]: order does not exist.`);
    return false;
  }

  // check status
  const indexOfStatus = Object.values(ORDER_STATUS).indexOf(status);
  if (indexOfStatus < 0) {
    console.log(`[${TAG_LOG_ERROR}]: status invalid.`);
    return false;
  }

  // check role of user change
  const indexOfUser = _listOrder
    .reduce((prevArr, currOrder) => {
      prevArr.push(currOrder.customerID);
      prevArr.push(currOrder.merchantID);
      prevArr.push(currOrder.shipperID);

      return prevArr;
    }, [])
    .indexOf(userID);

  if (indexOfUser < 0) {
    console.log(
      `[${TAG_LOG_ERROR}]: user not have permission to change status of this order.`
    );
    return false;
  }

  try {
    // Test
    const order = { ..._listOrder[indexOfOrder], id: orderID, status };
    // const order = await Order.findOne({ _id: orderID });
    // order.Status = status;
    // order?.save();

    // invoke event update
    let shouldEmitEvent = false;
    const prevStatus = _listOrder[indexOfOrder].status;
    _listOrder[indexOfOrder].status = status;

    // auto invoke event call shipper, customer
    switch (status) {
      case ORDER_STATUS.MERCHANT_CONFIRM:
        // send order to shipper
        shouldEmitEvent = true;
        sendOrderToShipper(order, 10);
        break;
      case ORDER_STATUS.DURING_GET:
        shouldEmitEvent = true;
        break;
      case ORDER_STATUS.DURING_SHIP:
        shouldEmitEvent = true;
        break;
      case ORDER_STATUS.DELIVERED:
        shouldEmitEvent = true;
        removeOrder(orderID);
        break;

      case ORDER_STATUS.CANCEL_BY_CUSTOMER:
        // check shipper, if the order doesn't have shipper, can cancel the order.
        shouldEmitEvent = false;
        if (!order.shipperID) {
          shouldEmitEvent = true;
          _listOrder[indexOfOrder].listShippersAreRequestedLv1.forEach(
            (shipperID) => {
              console.log(getShipper(shipperID));
              getShipper(shipperID).beingRequested = false;
            }
          );
          removeOrder(orderID);
        } else {
          _listOrder[indexOfOrder].status = prevStatus;
        }
        break;

      case ORDER_STATUS.CANCEL_BY_MERCHANT:
        shouldEmitEvent = true;
        removeOrder(orderID);
        break;

      case ORDER_STATUS.CANCEL_BY_SHIPPER:
        shouldEmitEvent = true;
        break;

      default:
        shouldEmitEvent = false;
        break;
    }

    if (!shouldEmitEvent) return false;
    _io
      .to(orderID)
      .emit(
        TAG_EVENT.RESPONSE_CHANGE_STATUS_ROOM,
        normalizeResponse("Change status order", { orderID, status })
      );

    return true;
  } catch (e) {
    console.log(`[${TAG_LOG_ERROR}]: ${e.message}`);
    return false;
  }
};

export const updateShipper = async (orderID, shipperID) => {
  // update on DB
  // await Order.findOneAndUpdate({ _id: orderID }, { Shipper: shipperID });

  const indexOrder = _listOrder.map((order) => order.orderID).indexOf(orderID);

  if (indexOrder < 0) return false;

  if (!_listOrder[indexOrder].shipperID) {
    _listOrder[indexOrder].shipperID = shipperID;
    return true;
  }

  return false;
};
