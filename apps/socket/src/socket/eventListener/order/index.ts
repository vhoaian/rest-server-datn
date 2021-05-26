import { Order } from "@vohoaian/datn-models";
import { TAG_EVENT, TAG_LOG_ERROR } from "../../TAG_EVENT";
import config from "../../../config";
import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import {
  getMerchant,
  sendOrderToMerchant,
} from "../merchant/merchantController";
import {
  getShipper,
  missOrder,
  sendOrderToShipper,
} from "../shipper/shipperController";
import {
  getCustomer,
  sendStatusPaymentToCustomer,
} from "../customer/customerController";

// Helper function to generate Number
const ENUM = (function* () {
  var index = 0;
  while (true) yield index++;
})();

export const ORDER_STATUS = {
  WAITING_PAYMENT: ENUM.next().value,
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
  optionPayment: "cash", // [zalopay, cash]
  status: ORDER_STATUS.WAITING,
};

const createOrder = (
  orderID: string,
  customerID: string,
  merchantID: string,
  shipperID: string,
  optionPayment: string
): any => {
  return {
    // @ts-expect-error
    ...ORDER_DEFAULT.clone(),
    orderID,
    shipperID,
    customerID,
    merchantID,
    optionPayment,
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

export const addOrder = async (orderID): Promise<boolean> => {
  try {
    const order: any = {
      id: orderID,
      Merchant: "605590f06480d31ec55b289d",
      Shipper: null,
      User: "6055849d6480d31ec55b2898",
      // User: "60abbfaabfbb5a38c0558d40",
      Tool: true,
      coor: { lat: 0, lng: 0 },
      PaymentMethod: 1,
      status: ORDER_STATUS.WAITING_PAYMENT,
    };

    // const order: any = await Order.findOne({ _id: orderID });

    _listOrder.push(
      createOrder(
        orderID,
        order.User,
        order.Merchant,
        order.Shipper,
        order.optionPayment
      )
    );

    _io.of("/").sockets.get(getCustomer(order.User).socketID).join(orderID);

    const merchantIsPartner = order.Tool;

    if (order.PaymentMethod === 0) {
      if (merchantIsPartner) {
        changeStatusOrder(orderID, order.Merchant, ORDER_STATUS.WAITING);
      } else {
        changeStatusOrder(orderID, order.User, ORDER_STATUS.MERCHANT_CONFIRM);
      }
    } else if (order.PaymentMethod === 1) {
    }

    return true;
  } catch (e) {
    console.log(`[${TAG_LOG_ERROR}_ADD_ORDER]: ${e.message}`);
    return false;
  }
};

const removeOrder = (orderID): void => {
  const indexOrder = _listOrder.findIndex((order) => order.orderID === orderID);
  const order = _listOrder[indexOrder];

  // leave all connect to room
  const merchantSocketID = getMerchant(order.merchantID).socketID;
  const shipperSocketID = getShipper(order.shipperID).socketID;
  _io.of("/").sockets.get(`${merchantSocketID}`).leave(orderID);
  _io.of("/").sockets.get(`${shipperSocketID}`).leave(orderID);

  _listOrder.splice(indexOrder, 1);
};

export const getOrderByID = (orderID): any => {
  return _listOrder.find((order) => order.orderID === orderID) || null;
};

export const getOrderByShipperID = (shipperID): any => {
  return _listOrder.filter((order) => order.shipperID === shipperID);
};

export const changeStatusOrder = async (
  orderID: string,
  userID: string,
  status: number
): Promise<boolean> => {
  // check order
  const orderOnList =
    _listOrder.find((order) => order.orderID === orderID) || null;
  if (!orderOnList) {
    console.log(`[${TAG_LOG_ERROR}]: order does not exist.`);
    return false;
  }

  // check status
  const isInValidStatus =
    Object.values(ORDER_STATUS).indexOf(status) < 0 ? true : false;
  if (isInValidStatus) {
    console.log(`[${TAG_LOG_ERROR}]: status invalid.`);
    return false;
  }

  // check role of user change
  const userPermission: boolean =
    [
      orderOnList.customerID,
      orderOnList.merchantID,
      orderOnList.shipperID,
      "system_admin",
    ].indexOf(userID) < 0
      ? false
      : true;

  if (!userPermission) {
    console.log(
      `[${TAG_LOG_ERROR}]: user not have permission to change status of this order.`
    );
    return false;
  }

  try {
    // const order = await Order.findOne({ _id: orderID });
    // order.Status = status;
    // order?.save();

    const prevStatus = orderOnList.status;

    // Test
    orderOnList.id = orderID;
    orderOnList.status = status;

    // Check case CUSTOMER cancel order
    if (status === ORDER_STATUS.CANCEL_BY_CUSTOMER)
      if (!orderOnList.shipperID) {
        _io
          .to(orderID)
          .emit(
            TAG_EVENT.RESPONSE_CHANGE_STATUS_ROOM,
            normalizeResponse("Change status order", { orderID, status })
          );

        orderOnList.listShippersAreRequestedLv1.forEach((shipperID) => {
          const shipper = getShipper(shipperID);
          shipper.beingRequested = false;
          _io.of("/").sockets.get(`${shipper.socketID}`).leave(orderID);
        });
        removeOrder(orderID);
        return true;
      } else {
        orderOnList.status = prevStatus;
        return false;
      }

    _io
      .to(orderID)
      .emit(
        TAG_EVENT.RESPONSE_CHANGE_STATUS_ROOM,
        normalizeResponse("Change status order", { orderID, status })
      );

    // auto invoke event call shipper, customer
    switch (status) {
      case ORDER_STATUS.WAITING:
        // This method will invoke by add order or another where

        // If order invoke by ZaloPay Callback
        if (orderOnList.optionPayment === "zalopay")
          sendStatusPaymentToCustomer(orderOnList.customerID, orderOnList);

        sendOrderToMerchant(orderOnList.merchantID, orderOnList);
        break;

      case ORDER_STATUS.MERCHANT_CONFIRM:
        sendOrderToShipper(orderOnList, 10);
        break;
      case ORDER_STATUS.DURING_GET:
        break;
      case ORDER_STATUS.DURING_SHIP:
        break;
      case ORDER_STATUS.DELIVERED:
        removeOrder(orderID);
        break;

      case ORDER_STATUS.CANCEL_BY_CUSTOMER:
        // check shipper, if the order doesn't have shipper, can cancel the order.
        break;

      case ORDER_STATUS.CANCEL_BY_MERCHANT:
        removeOrder(orderID);
        break;

      case ORDER_STATUS.CANCEL_BY_SHIPPER:
        break;

      default:
        break;
    }

    return true;
  } catch (e) {
    console.log(`[${TAG_LOG_ERROR}]: ${e.message}`);
    return false;
  }
};

export const updateShipper = async (orderID, shipperID): Promise<boolean> => {
  // update on DB
  // await Order.findOneAndUpdate({ _id: orderID }, { Shipper: shipperID });

  const order = _listOrder.find((order) => order.orderID === orderID) || null;

  if (!order) return false;

  if (!order.shipperID) {
    order.shipperID = shipperID;
    order.listShippersAreRequestedLv1
      .filter((shipper) => shipper !== shipperID)
      .forEach((shipperID) => missOrder(orderID, shipperID));
    return true;
  }

  return false;
};
