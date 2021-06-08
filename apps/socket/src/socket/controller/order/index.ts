import {
  Order,
  Restaurant,
  Shipper,
  ZaloTransaction,
} from "@vohoaian/datn-models";
import mongoose from "mongoose";
import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import config from "../../../config";
import { TAG_EVENT, TAG_LOG_ERROR } from "../../TAG_EVENT";
import customerController from "../customer/customerController";
import merchantController from "../merchant/merchantController";
import shipperController from "../shipper/shipperController";
import clone from "../../../utils/clone";
import zaloPay from "apps/socket/src/payment/ZaloPay";

// Helper function to generate Number
const ENUM = (function* () {
  var index = 0;
  while (true) yield index++;
})();

interface ORDER {
  orderID: string | null;
  shipperID: string | null;
  customerID: string | null;
  merchantID: string | null;
  listShipperSkipOrder: Array<string>;
  listShipperAreBeingRequest: Array<string>;
  paymentMethod: 0 | 1;
  status: number;
  selfDestruct: any;
}

class OrderController {
  public _io: any = null;
  private _listOrder: Array<ORDER> = [];
  private _MAX_TIME_DELAY_PAID = 1000 * (60 * 1 + 30);

  public ORDER_STATUS: any = {
    WAITING_PAYMENT: ENUM.next().value,
    WAITING: ENUM.next().value,
    MERCHANT_CONFIRM: ENUM.next().value,
    DURING_GET: ENUM.next().value,
    DURING_SHIP: ENUM.next().value,
    DELIVERED: ENUM.next().value,
    CANCEL_BY_CUSTOMER: ENUM.next().value,
    CANCEL_BY_MERCHANT: ENUM.next().value,
    CANCEL_BY_SHIPPER: ENUM.next().value,
  };

  private ORDER_DEFAULT: ORDER = {
    orderID: null,
    shipperID: null,
    customerID: null,
    merchantID: null,
    listShipperSkipOrder: [],
    listShipperAreBeingRequest: [],
    paymentMethod: 0, // [1: zalopay, 0: cash]
    status: this.ORDER_STATUS.WAITING,
    selfDestruct: null,
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
  ): ORDER {
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

  getOrderByID = (orderID): ORDER | null => {
    return (
      this._listOrder.find((order) => order.orderID === `${orderID}`) || null
    );
  };

  async addOrder(orderID): Promise<boolean> {
    try {
      const orderDB: any = await Order.findOne({ _id: orderID });
      const order = orderDB.toObject();

      const newOrder = this.createOrder(
        orderID,
        `${order.User}`,
        `${order.Restaurant}`,
        order.Shipper ? `${order.Shipper}` : null,
        order.PaymentMethod
      );

      this._listOrder.push(newOrder);
      const socketCustomer = customerController.getSocket(order.User);
      if (socketCustomer) socketCustomer.join(orderID);

      const merchantIsPartner = order.Tool;

      if (order.PaymentMethod === 0) {
        if (merchantIsPartner) {
          console.log("[ORDER]: SEND ORDER TO MERCHANT");
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
        // Set timeout cancle order after 15 minutes
        newOrder.selfDestruct = setTimeout(() => {
          this.changeStatusOrder(
            orderID,
            "system_admin",
            this.ORDER_STATUS.CANCEL_BY_CUSTOMER
          );
          console.log(
            "[ORDER]: auto delete order, user deplay paid order with ZaloPay"
          );
        }, this._MAX_TIME_DELAY_PAID);
      }

      return true;
    } catch (e) {
      console.log(`[${TAG_LOG_ERROR}_ADD_ORDER]: ${e.message}`);
      return false;
    }
  }

  clearSelfDestructOrder(orderID) {
    const order = this.getOrderByID(orderID);
    if (!order)
      return console.log(
        `[ORDER]: clear self destructuring fail, order not found.`
      );

    clearTimeout(order.selfDestruct);
    order.selfDestruct = null;

    console.log(`[ORDER]: clear self destructuring success.`);
  }

  removeOrder(orderID): void {
    console.log("REMOVE ORDER");

    const indexOrder = this._listOrder.findIndex(
      (order) => order.orderID === orderID
    );
    const { merchantID, shipperID } = this._listOrder[indexOrder];

    // leave all connect to room
    merchantController.getSocket(merchantID)?.leave(orderID);
    shipperController.getSocket(shipperID)?.leave(orderID);

    this._listOrder.splice(indexOrder, 1);
  }

  getOrderByShipperID(shipperID): Array<ORDER> {
    return this._listOrder.filter((order) => order.shipperID === shipperID);
  }

  getOrderByMerchantID(merchantID): Array<ORDER> {
    return this._listOrder.filter((order) => order.merchantID === merchantID);
  }

  getOrderByCustomerID(customerID): Array<ORDER> {
    return this._listOrder.filter((order) => order.customerID === customerID);
  }

  async changeStatusOrder(
    orderID: string,
    userID: string,
    status: number
  ): Promise<boolean> {
    // check order
    const orderOnList: any = this.getOrderByID(orderID);
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

          // refund
          if (this.getOrderByID(orderID)?.paymentMethod === 1) {
            console.log("[ORDER]: refund.");
            //

            const zpTrans = await ZaloTransaction.findOne({
              Order: mongoose.Types.ObjectId(orderID),
            });

            zaloPay
              .Refund({
                zp_trans_id: zpTrans?.TransID,
                amount: zpTrans?.Amount,
                description: `Refund for order ${orderID}`,
              })
              .then((d) => console.log(`[ORDER]: ${d}`));
          }

          this.removeOrder(orderID);
          console.log("[ORDER]: customer cancel order success.");

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

        case this.ORDER_STATUS.DELIVERED: {
          // Share money for shipper & merchant
          const _orderInList = this.getOrderByID(orderID);
          this.removeOrder(orderID);

          if (_orderInList?.paymentMethod === 1) {
            const _order = await Order.findById(orderID);
            if (!_order) break;

            const _shipper = await Shipper.findById(_order.Shipper);
            const _merchant = await Restaurant.findById(_order.Restaurant);
            if (!_shipper || !_merchant) break;

            _shipper.Wallet = _order.ShippingFee;
            _merchant.Wallet = _order.Total - _order.ShippingFee;
            await Promise.all([_shipper?.save(), _merchant?.save()]);
          }

          break;
        }

        case this.ORDER_STATUS.CANCEL_BY_CUSTOMER:
        case this.ORDER_STATUS.CANCEL_BY_MERCHANT:
        case this.ORDER_STATUS.CANCEL_BY_SHIPPER:
          // refund
          if (this.getOrderByID(orderID)?.paymentMethod === 1) {
            console.log("[ORDER]: refund.");
            //

            const zpTrans = await ZaloTransaction.findOne({
              Order: mongoose.Types.ObjectId(orderID),
            });

            zaloPay
              .Refund({
                zp_trans_id: zpTrans?.TransID,
                amount: zpTrans?.Amount,
                description: `Refund for order ${orderID}`,
              })
              .then((d) => console.log(`[ORDER]: ${d}`));
          }

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
