import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import config from "../../../config";
import { calcDistanceBetween2Coor } from "../../../utils/calcDistance";
import { TAG_EVENT, TAG_LOG_ERROR } from "../../TAG_EVENT";
import orderController from "../order";
import clone from "../../../utils/clone";
import { ChatRoom, Order, Shipper, Types } from "@vohoaian/datn-models";
import { mapOptions, normalOrder } from "../order/utils";
import chatController from "../chat";
import customerController from "../customer/customerController";
import SHIPPER from "./interface";

const SHIPPER_DEFAULT = {
  id: null,
  socketID: null,
  coor: { lat: 0, lng: 0 },
  listOrderID: [],
  beingRequested: false,
  maximumOrder: 3,
  maximumDistance: 100, // unit: km
  maximumAmount: 1000000, // unit VND
  rating: 0,
  historyOrder: {
    skip: 0,
    cancel: 0,
    delivered: 0,
  },
  selfDestruct: null,
};

const sleep = (time: number) => new Promise((r) => setTimeout(r, time));

class ShipperController {
  public _io: any = null;
  private _listShipperOnline: Array<any> = [];

  private MAXIMUM_TIME_DESTRUCT: number = 10 * 1000;
  private MAXIMUM_TIME_DELAY_REQUEST_ORDER = 10 * 1000;

  private POINT = {
    skip: -1,
    cancel: -2,
    delevered: 4, // Default for new shipper hasn't any rating.
  };

  constructor() {
    // [LOG]: Log list customer online every 5 seconds
    if (config.LOG_SOCKET.indexOf("shipper") > -1) {
      setInterval(() => {
        console.log("LIST SHIPPER ONLINE");
        console.table(this._listShipperOnline);
      }, 5000);
    }
  }

  private createShipper(
    id,
    socketID,
    coor,
    maximumOrder,
    maximumDistance,
    maximumAmount,
    historyOrder,
    rating
  ): SHIPPER {
    return {
      ...clone(SHIPPER_DEFAULT),
      id,
      socketID,
      coor,
      maximumOrder,
      maximumDistance,
      maximumAmount,
      historyOrder,
      rating,
    };
  }

  setIO(io) {
    this._io = io;
  }

  getSocket(id): any {
    const shipper = this.getShipper(id);
    if (!shipper) return null;

    return this._io.of("/").sockets.get(`${shipper.socketID}`);
  }

  getShipper(id): SHIPPER | null {
    return this._listShipperOnline.find((shipper) => shipper.id === id) || null;
  }

  getShipperBySocketID(socketID): SHIPPER | null {
    return (
      this._listShipperOnline.find(
        (shipper) => shipper.socketID === socketID
      ) || null
    );
  }

  async addShipper(id, socketID, coor) {
    // auto reconnect
    const shipper: any = this.getShipper(id);
    if (shipper) {
      console.log("SHIPPER RECONNECT");
      shipper.socketID = socketID;
      shipper.coor = coor;
      clearTimeout(shipper.selfDestruct);
      shipper.selfDestruct = null;
    } else {
      const _shipperOnDB = await Shipper.findById(id);
      if (!_shipperOnDB) return;

      const { Setting, History, Rating } = _shipperOnDB;
      this._listShipperOnline.push(
        this.createShipper(
          id,
          socketID,
          coor,
          Setting.MaxOrder,
          Setting.MaxDistance,
          Setting.MaxAmount,
          {
            skip: History.Skip,
            cancel: History.Cancel,
            delivered: History.Delivery,
          },
          Rating
        )
      );
    }

    // send all order if shipper has order before
    const listOrder = orderController
      .getOrderByShipperID(id)
      .map((order) => ({ ...order, id: order.orderID }));
    if (listOrder.length === 0) return;

    // join room
    const socketShipper = this.getSocket(id);
    listOrder.forEach((odr) => socketShipper.join(odr.id));

    socketShipper.emit(
      TAG_EVENT.RESPONSE_SHIPPER_RECONNECT,
      normalizeResponse("Reconnect", { listOrder })
    );
  }

  removeShipper(id) {
    const shipper = this.getShipper(id);
    if (!shipper)
      return console.log(
        `[${TAG_LOG_ERROR}_REMOVE_SHIPPER]: shipper does not exits`
      );

    orderController.getOrderByShipperID(id).forEach((order) => {
      orderController.getSocket(order.orderID).emit(
        TAG_EVENT.RESPONSE_DISCONNECT_ROOM,
        normalizeResponse("Shipper disconnect", {
          orderID: order.orderID,
          shipper: id,
        })
      );
    });

    // Set timeout to seft destruct
    shipper.selfDestruct = setTimeout(() => {
      this.handleShipperDisconnect(id);
    }, this.MAXIMUM_TIME_DESTRUCT);
  }

  private async handleShipperDisconnect(id) {
    // Cancel all order
    const shipper: SHIPPER | null = this.getShipper(id);
    if (!shipper) return;

    // Save status shipper
    const { cancel, skip, delivered } = shipper.historyOrder;
    await Shipper.findOneAndUpdate(
      { _id: shipper.id },
      { History: { Skip: skip, Cancel: cancel, Delivery: delivered } }
    );

    for (const orderID of shipper.listOrderID) {
      await orderController.changeStatusOrder(
        orderID,
        // @ts-expect-error
        shipper.id,
        orderController.ORDER_STATUS.CANCEL_BY_SHIPPER
      );
    }

    // Delete shipper
    const index = this._listShipperOnline.findIndex(
      (shipper) => shipper.id === id
    );
    this._listShipperOnline.splice(index, 1);
  }

  updateShipperCoor(id, coor) {
    const shipper = this.getShipper(id);
    if (!shipper) return;

    // Update coor
    shipper.coor = {
      lat: parseFloat(coor.lat),
      lng: parseFloat(coor.lng),
    };

    console.log(shipper.listOrderID);

    // Invoke event update coor shipper
    shipper.listOrderID.forEach((orderID) => {
      console.log("UPDATE COOR SHIPPER TO ORDER");
      orderController
        .getSocket(orderID)
        .emit(
          TAG_EVENT.RESPONSE_SHIPPER_CHANGE_COOR,
          normalizeResponse("Update Coor Shipper", coor)
        );
    });
  }

  async sendOrderToShipper(orderInList, maxShipper) {
    // Get order to return for merchant
    const orderDB: any = await Order.findOne({ _id: orderInList.orderID })
      .populate("User", "Avatar Email FullName Phone")
      .populate("Restaurant", "Address Avatar IsPartner Phone Location Name")
      .populate("Foods.Food", "Name Avatar OriginalPrice Options");

    const order: any = orderDB.toObject();
    mapOptions(order);
    normalOrder(order);

    const [latMer = 0, lngMer = 0] = order.Restaurant.Location.coordinates;
    const coorMerchant = {
      lat: latMer,
      lng: lngMer,
    };

    do {
      const orderInController = orderController.getOrderByID(order._id);
      if (!orderInController) return;

      const listShipperSelected = clone(this._listShipperOnline)
        // 1. Filter shipper full order
        .filter((shipper) => shipper.listOrderID.length < shipper.maximumOrder)
        // 2. Filter shipper being requested
        .filter((shipper) => !shipper.beingRequested)
        // 3. Filter shipper skip order
        .filter(
          (shipper) =>
            !orderInController.listShipperSkipOrder.find(
              (sprID) => sprID === shipper.id
            )
        )
        // 4. Filter if distance is larger than shipper's expectation
        .filter((shipper) => {
          console.log(shipper.coor);
          console.log(coorMerchant);
          console.log(calcDistanceBetween2Coor(coorMerchant, shipper.coor));
          return (
            shipper.maximumDistance >=
            calcDistanceBetween2Coor(coorMerchant, shipper.coor)
          );
        })
        // 5. Sort to get nearest shippers
        .sort((shipper1: SHIPPER, shipper2: SHIPPER) => {
          // Sort by distance
          const shipper1Distance = calcDistanceBetween2Coor(
            coorMerchant,
            shipper1.coor
          );
          const shipper2Distance = calcDistanceBetween2Coor(
            coorMerchant,
            shipper2.coor
          );

          if (shipper1Distance > shipper2Distance) return -1;
          if (shipper1Distance < shipper2Distance) return 1;

          const {
            skip: skipShipper1,
            cancel: cancleShipper1,
            delivered: deliveredShipper1,
          } = shipper1.historyOrder;
          const {
            skip: skipShipper2,
            cancel: cancleShipper2,
            delivered: deliveredShipper2,
          } = shipper2.historyOrder;

          // Sort by Point
          const shipper1Point =
            (skipShipper1 * this.POINT.skip +
              cancleShipper1 * this.POINT.cancel +
              deliveredShipper1 * shipper1.rating || this.POINT.delevered) /
            (skipShipper1 + cancleShipper1 + deliveredShipper1);

          const shipper2Point =
            (skipShipper2 * this.POINT.skip +
              cancleShipper2 * this.POINT.cancel +
              deliveredShipper2 * shipper2.rating || this.POINT.delevered) /
            (skipShipper2 + cancleShipper2 + deliveredShipper2);

          if (shipper1Point > shipper2Point) return 1;
          if (shipper1Point <= shipper2Point) return -1;
        })
        // <>
        // Add more rule to sort shipper
        // <>
        .slice(0, maxShipper);

      console.log("[ORDER]: send order to shipper.");
      console.log(
        `[ORDER]: number shipper server selected: ${listShipperSelected.length}`
      );

      // Send order to Shipper
      listShipperSelected.forEach((shipper) => {
        orderInController.listShipperAreBeingRequest.push(shipper.id);

        // @ts-expect-error
        this.getShipper(shipper.id).beingRequested = true;

        const socketShipper = this.getSocket(shipper.id);
        socketShipper.join(orderInList.orderID);
        socketShipper.emit(
          TAG_EVENT.RESPONSE_SHIPPER_CONFIRM_ORDER,
          normalizeResponse("Confirm order", {
            ...order,
            Status: orderInList.status,
            requestTime: this.MAXIMUM_TIME_DELAY_REQUEST_ORDER,
          })
        );
      });

      await sleep(this.MAXIMUM_TIME_DELAY_REQUEST_ORDER);

      if (listShipperSelected.length === 0) {
        orderInController.listShipperSkipOrder = [];
        continue;
      }

      const orderBreak = orderController.getOrderByID(`${order._id}`);
      if (
        !orderBreak ||
        orderBreak.status === orderController.ORDER_STATUS.CANCEL_BY_CUSTOMER ||
        orderBreak.shipperID
      )
        break;

      listShipperSelected.forEach((shipper) => {
        this.missOrder(orderBreak.orderID, shipper.id);
        orderInController.listShipperSkipOrder.push(shipper.id);
        orderInController.listShipperAreBeingRequest = [];
      });

      console.log(
        "[ORDER]: order don't have any shipper, retry to find shipper."
      );
    } while (true);
  }

  missOrder(orderID, shipperID) {
    const shipper = this.getShipper(shipperID);
    if (!shipper) return;

    shipper.beingRequested = false;
    shipper.historyOrder.skip++;

    const socketShipper = this.getSocket(shipperID);

    socketShipper?.leave(orderID);
    socketShipper.emit(
      TAG_EVENT.RESPONSE_SHIPPER_SKIP_CONFIRM_ORDER,
      normalizeResponse(
        "This order already has shipper, please skip this order",
        { orderID }
      )
    );
  }

  async confirmOrder(orderID, shipperID) {
    const shipper = this.getShipper(shipperID);
    if (!shipper) return false;

    shipper.beingRequested = false;
    const socketShipper = this.getSocket(shipperID);

    // Check the order is there any shipper?
    if (!(await orderController.updateShipper(orderID, shipperID))) {
      socketShipper.emit(
        TAG_EVENT.RESPONSE_SHIPPER_CONFIRM_ORDER_FAILED,
        normalizeResponse(
          "Confirm order failed, the order already has shipper.",
          { orderID }
        )
      );
      return false;
    }

    shipper.listOrderID.push(orderID);

    console.log("[ORDER]: shipper confirm order success.");

    // Update status order
    await orderController.changeStatusOrder(
      orderID,
      shipperID,
      orderController.ORDER_STATUS.DURING_GET
    );

    const customerID = orderController.getOrderByID(orderID)?.customerID;
    chatController.openRoom(
      shipperID,
      // @ts-expect-error
      customerID
    );

    // Update Info for customer
    const infoShipper = await Shipper.findById(shipperID).select(
      "Avatar FullName Phone"
    );
    orderController
      .getSocket(orderID)
      ?.emit(
        TAG_EVENT.RESPONSE_UPDATE_SHIPPER,
        normalizeResponse("update info shipper", { infoShipper, orderID })
      );

    return true;
  }

  skipOrder(orderID, socketID) {
    console.log("[ORDER]: shipper skip order.");
    const shipper = this.getShipperBySocketID(socketID);
    if (!shipper) return;

    shipper.beingRequested = false;
    shipper.historyOrder.skip++;
  }

  async cancelOrder(orderID, shipperID) {
    // Update shipper
    const shipper = this.getShipper(shipperID);
    if (!shipper) return;

    const indexOrderID = shipper.listOrderID.indexOf(orderID);
    shipper.listOrderID.splice(indexOrderID, 1);
    shipper.historyOrder.cancel++;

    console.log("[ORDER]: shipper cancel order.");

    const order = orderController.getOrderByID(orderID);

    const customerID = order?.customerID || "";
    const _room = await ChatRoom.findOne({
      Shipper: Types.ObjectId(shipperID),
      User: Types.ObjectId(customerID),
    });

    chatController.sendMessage(
      // @ts-expect-error
      `${_room._id}`,
      "shipper",
      "Đơn hàng đã bị hủy. Chúng tôi rất tiếc vì điều này."
    );

    // Update status order
    orderController.changeStatusOrder(
      orderID,
      // @ts-expect-error
      shipper.id,
      orderController.ORDER_STATUS.CANCEL_BY_SHIPPER
    );
  }

  async tookFood(orderID, shipperID) {
    console.log("[ORDER]: shipper took food, during ship");

    const order = orderController.getOrderByID(orderID);

    const customerID = order?.customerID || "";
    const _room = await ChatRoom.findOne({
      Shipper: Types.ObjectId(shipperID),
      User: Types.ObjectId(customerID),
    });

    chatController.sendMessage(
      // @ts-expect-error
      `${_room._id}`,
      "shipper",
      "Shipper đã lấy đơn hàng của bạn. Vui lòng giữ liên lạc để shipper có thể giao hàng."
    );

    // Update status order
    orderController.changeStatusOrder(
      orderID,
      shipperID,
      orderController.ORDER_STATUS.DURING_SHIP
    );
  }

  async deliveredOrder(orderID, shipperID) {
    const shipper = this.getShipper(shipperID);
    if (!shipper) return;

    console.log("[ORDER]: shipper delivered order.");

    const indexOrder: number = shipper.listOrderID.indexOf(orderID);
    shipper.listOrderID.splice(indexOrder, 1);
    shipper.historyOrder.delivered++;

    const order = orderController.getOrderByID(orderID);

    const customerID = order?.customerID || "";
    const _room = await ChatRoom.findOne({
      Shipper: Types.ObjectId(shipperID),
      User: Types.ObjectId(customerID),
    });

    chatController.sendMessage(
      // @ts-expect-error
      `${_room._id}`,
      "shipper",
      "Yayy. Đơn hàng của bạn đã được giao thành công. Hẹn gặp bạn vào lần sau nhé. Chúc bạn ngon miệng!! ^^"
    );

    // Update status order
    orderController.changeStatusOrder(
      orderID,
      shipperID,
      orderController.ORDER_STATUS.DELIVERED
    );
  }
}
const shipperController = new ShipperController();
export default shipperController;
