import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import config from "../../../config";
import { TAG_EVENT, TAG_LOG_ERROR } from "../../TAG_EVENT";
import customerController from "../customer/customerController";
import merchantController from "../merchant/merchantController";
import shipperController from "../shipper/shipperController";

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
    optionPayment
  ): any {
    return {
      ...this.ORDER_DEFAULT.clone(),
      orderID,
      shipperID,
      customerID,
      merchantID,
      optionPayment,
    };
  }

  getSocket(orderID) {
    return this._io.to(orderID);
  }

  getOrderByID = (orderID): any => {
    return this._listOrder.find((order) => order.orderID === orderID) || null;
  };

  async addOrder(orderID): Promise<boolean> {
    try {
      const order: any = {
        id: orderID,
        Merchant: "605590f06480d31ec55b289d",
        Shipper: null,
        User: "6055849d6480d31ec55b2898",
        // User: "60abbfaabfbb5a38c0558d40",
        Tool: true,
        coor: { lat: 0, lng: 0 },
        PaymentMethod: 0,
        status: this.ORDER_STATUS.WAITING_PAYMENT,
      };

      // const order: any = await Order.findOne({ _id: orderID });

      this._listOrder.push(
        this.createOrder(
          orderID,
          order.User,
          order.Merchant,
          order.Shipper,
          order.optionPayment
        )
      );

      customerController.getSocket(order.User).join(orderID);

      const merchantIsPartner = order.Tool;

      if (order.PaymentMethod === 0) {
        if (merchantIsPartner) {
          this.changeStatusOrder(
            orderID,
            order.Merchant,
            this.ORDER_STATUS.WAITING
          );
        } else {
          this.changeStatusOrder(
            orderID,
            order.User,
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
      // const order = await Order.findOne({ _id: orderID });
      // order.Status = status;
      // order?.save();

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
          shipperController.sendOrderToShipper(orderOnList, 2);
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

      return true;
    } catch (e) {
      console.log(`[${TAG_LOG_ERROR}]: ${e.message}`);
      return false;
    }
  }

  async updateShipper(orderID, shipperID): Promise<boolean> {
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
      return true;
    }

    return false;
  }
}

const orderController = new OrderController();
export default orderController;
