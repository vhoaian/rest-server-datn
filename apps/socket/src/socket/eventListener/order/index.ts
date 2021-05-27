import { Order } from "@vohoaian/datn-models";
import mongoose from "mongoose";
import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import config from "../../../config";
import { TAG_EVENT, TAG_LOG_ERROR } from "../../TAG_EVENT";
import customerController from "../customer/customerController";
import merchantController from "../merchant/merchantController";
import shipperController from "../shipper/shipperController";
import clone from "../../../utils/clone";

// Helper function to generate Number
const ENUM = (function* () {
  var index = 0;
  while (true) yield index++;
})();

class OrderController {
  public _io: any = null;
  private _listOrder: Array<any> = [];

  public ORDER_STATUS: any = {
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

  private ORDER_DEFAULT: any = {
    orderID: null,
    shipperID: null,
    customerID: null,
    merchantID: null,
    listShipperSkipOrder: [],
    listShipperAreBeingRequest: [],
    optionPayment: "cash", // [zalopay, cash]
    status: this.ORDER_STATUS.WAITING,
  };

  constructor() {
    // Log list customer online
    if (config.LOG_SOCKET.indexOf("order") > -1)
      setInterval(() => {
        console.log("LIST ORDER ONLINE");
        console.table(this._listOrder);
      }, 5000);
  }

  setIO(io) {
    this._io = io;
  }

  private createOrder(
    orderID,
    customerID,
    merchantID,
    shipperID,
    paymentMethod
  ): any {
    return {
      ...clone(this.ORDER_DEFAULT),
      orderID,
      shipperID,
      customerID,
      merchantID,
      paymentMethod,
    };
  }

  getSocket(orderID) {
    return this._io.to(orderID);
  }

  getOrderByID = (orderID): any => {
    return (
      this._listOrder.find((order) => order.orderID === `${orderID}`) || null
    );
  };

  async addOrder(orderID): Promise<boolean> {
    try {
      const orderDB: any = await Order.findOne({ _id: orderID });
      const order = orderDB.toObject();

      this._listOrder.push(
        this.createOrder(
          orderID,
          `${order.User}`,
          `${order.Restaurant}`,
          order.Shipper ? `${order.Shipper}` : null,
          order.PaymentMethod
        )
      );
      const socketCustomer = customerController.getSocket(order.User);
      if (socketCustomer) socketCustomer.join(orderID);

      const merchantIsPartner = order.Tool;

      if (order.PaymentMethod === 0) {
        if (merchantIsPartner) {
          console.log("SEND ORDER TO MERCHANT");
          this.changeStatusOrder(
            orderID,
            `${order.Restaurant}`,
            this.ORDER_STATUS.WAITING
          );
        } else {
          this.changeStatusOrder(
            orderID,
            `${order.User}`,
            this.ORDER_STATUS.MERCHANT_CONFIRM
          );
        }
      } else if (order.PaymentMethod === 1) {
      }

      return true;
    } catch (e) {
      console.log(`[${TAG_LOG_ERROR}_ADD_ORDER]: ${e.message}`);
      return false;
    }
  }

  removeOrder(orderID): void {
    console.log("REMOVE ORDER");

    const indexOrder = this._listOrder.findIndex(
      (order) => order.orderID === orderID
    );
    const { merchantID, shipperID } = this._listOrder[indexOrder];

    // leave all connect to room
    if (merchantID) merchantController.getSocket(merchantID).leave(orderID);
    if (shipperID) shipperController.getSocket(shipperID).leave(orderID);

    this._listOrder.splice(indexOrder, 1);
  }

  getOrderByShipperID(shipperID): any {
    return this._listOrder.filter((order) => order.shipperID === shipperID);
  }

  getOrderByMerchantID(merchantID): any {
    return this._listOrder.filter((order) => order.merchantID === merchantID);
  }

  getOrderByCustomerID(customerID): any {
    return this._listOrder.filter((order) => order.customerID === customerID);
  }

  async changeStatusOrder(
    orderID: string,
    userID: string,
    status: number
  ): Promise<boolean> {
    // check order
    const orderOnList = this.getOrderByID(orderID);
    if (!orderOnList) {
      console.log(`[${TAG_LOG_ERROR}]: order does not exist.`);
      return false;
    }

    // check status
    const isInValidStatus =
      Object.values(this.ORDER_STATUS).indexOf(status) < 0 ? true : false;
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
      const order = await Order.findOne({ _id: orderID })
        .populate("User")
        .populate("Restaurant");

      const prevStatus = orderOnList.status;

      // Test
      orderOnList.id = orderID;
      orderOnList.status = status;

      // Check case CUSTOMER cancel order
      if (status === this.ORDER_STATUS.CANCEL_BY_CUSTOMER) {
        if (!orderOnList.shipperID) {
          this.getSocket(orderID).emit(
            TAG_EVENT.RESPONSE_CHANGE_STATUS_ROOM,
            normalizeResponse("Change status order", { orderID, status })
          );

          orderOnList.listShipperAreBeingRequest.forEach((shipperID) => {
            const shipper = shipperController.getShipper(shipperID);
            shipper.beingRequested = false;
            shipperController.getSocket(shipperID).leave(orderID);
          });
          this.removeOrder(orderID);

          // Update status order on database
          await Order.updateOne({ _id: orderID }, { Status: status });
          return true;
        } else {
          orderOnList.status = prevStatus;
          return false;
        }
      }

      this.getSocket(orderID).emit(
        TAG_EVENT.RESPONSE_CHANGE_STATUS_ROOM,
        normalizeResponse("Change status order", { orderID, status })
      );

      // auto invoke event call shipper, customer
      switch (status) {
        case this.ORDER_STATUS.WAITING:
          // This method will invoke by add order or another where

          // If order invoke by ZaloPay Callback
          if (orderOnList.optionPayment === "zalopay")
            customerController.sendStatusPaymentToCustomer(
              orderOnList.customerID,
              orderOnList
            );

          merchantController.sendOrderToMerchant(
            orderOnList.merchantID,
            orderOnList
          );
          break;

        case this.ORDER_STATUS.MERCHANT_CONFIRM:
          shipperController.sendOrderToShipper(orderOnList, 1);
          break;
        case this.ORDER_STATUS.DURING_GET:
          break;
        case this.ORDER_STATUS.DURING_SHIP:
          break;
        case this.ORDER_STATUS.DELIVERED:
          this.removeOrder(orderID);
          break;

        case this.ORDER_STATUS.CANCEL_BY_CUSTOMER:
          this.removeOrder(orderID);
          break;

        case this.ORDER_STATUS.CANCEL_BY_MERCHANT:
          this.removeOrder(orderID);
          break;

        case this.ORDER_STATUS.CANCEL_BY_SHIPPER:
          this.removeOrder(orderID);
          break;

        default:
          break;
      }

      // Update status order on database
      await Order.updateOne({ _id: orderID }, { Status: status });

      return true;
    } catch (e) {
      console.log(`[${TAG_LOG_ERROR}]: ${e.message}`);
      return false;
    }
  }

  async updateShipper(orderID: string, shipperID: string): Promise<boolean> {
    // update on DB
    // await Order.findOneAndUpdate({ _id: orderID }, { Shipper: shipperID });

    const order = this.getOrderByID(orderID);

    if (!order) return false;

    if (!order.shipperID) {
      order.shipperID = shipperID;
      order.listShipperAreBeingRequest
        .filter((shipper) => shipper !== shipperID)
        .forEach((shipperID) =>
          shipperController.missOrder(orderID, shipperID)
        );

      await Order.updateOne(
        { _id: orderID },
        { Shipper: new mongoose.Types.ObjectId(shipperID) }
      );
      return true;
    }

    return false;
  }
}

const orderController = new OrderController();
export default orderController;
