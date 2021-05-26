import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import config from "../../../config";
import { TAG_EVENT, TAG_LOG_ERROR } from "../../TAG_EVENT";
import orderController from "../order";

class MerchantController {
  private _listMerchantOnline: Array<any> = [];
  private _io: any = null;
  private MERCHANT_DEFAULT: any = {
    id: null,
    socketID: null,
    listOrderID: [],
    selfDestruct: null,
  };
  private MAXIMUM_TIME_DESTRUCT: number = 10 * 1000;

  constructor() {
    // Log list customer online
    if (config.LOG_SOCKET.indexOf("merchant") > -1)
      setInterval(() => {
        console.log("LIST MERCHANT ONLINE");
        console.table(this._listMerchantOnline);
      }, 5000);
  }

  setIO(io) {
    this._io = io;
  }

  addMerchant = (id, socketID) => {
    const merchant = this.getMerchant(id);
    if (merchant) {
      console.log("MERCHANT RECONNECT");
      merchant.socketID = socketID;
      clearTimeout(merchant.selfDestruct);
      merchant.selfDestruct = null;
    } else {
      this._listMerchantOnline.push({
        ...this.MERCHANT_DEFAULT.clone(),
        id,
        socketID,
      });
    }

    // send all order if merchant has order before
    const listOrder = orderController
      .getOrderByMerchantID(id)
      .map((order) => ({ ...order, id: order.orderID }));
    if (listOrder.length === 0) return;

    // join room
    const socketMerchant = this.getSocket(id);
    listOrder.forEach((odr) => socketMerchant.join(odr.id));

    socketMerchant.emit(
      TAG_EVENT.RESPONSE_MERCHANT_RECONNECT,
      normalizeResponse("Reconnect", { listOrder })
    );
  };

  getMerchant(id): any {
    return (
      this._listMerchantOnline.find((merchant) => merchant.id === id) || null
    );
  }

  getSocket(merchantID) {
    return this._io
      .of("/")
      .sockets.get(`${this.getMerchant(merchantID).socketID}`);
  }

  removeMerchant(id) {
    const merchant = this.getMerchant(id);
    if (!merchant)
      return console.log(
        `[${TAG_LOG_ERROR}_REMOVE_MERCHANT]: merchant does not exits`
      );

    orderController.getOrderByMerchantID(id).forEach((order) => {
      orderController.getSocket(order.orderID).emit(
        TAG_EVENT.RESPONSE_DISCONNECT_ROOM,
        normalizeResponse("Merchant disconnect", {
          orderID: order.orderID,
          merchantID: id,
        })
      );
    });

    // Set timeout to seft destruct
    merchant.selfDestruct = setTimeout(() => {
      this.handleMerchantDisconnect(id);
    }, this.MAXIMUM_TIME_DESTRUCT);
  }

  private handleMerchantDisconnect(id) {
    // Delete merchant
    const index = this._listMerchantOnline.findIndex(
      (merchant) => merchant.id === id
    );
    this._listMerchantOnline.splice(index, 1);
  }

  sendOrderToMerchant(merchantID, order) {
    const merchantSocket = this.getSocket(merchantID);

    merchantSocket.emit(
      TAG_EVENT.RESPONSE_MERCHANT_CONFIRM_ORDER,
      normalizeResponse("Server request confirm order", order)
    );

    merchantSocket.join(order.id);
  }

  confirmOrder(orderID, merchantID) {
    // Update status order
    return orderController.changeStatusOrder(
      orderID,
      merchantID,
      orderController.ORDER_STATUS.MERCHANT_CONFIRM
    );
  }

  cancelOrder(orderID, merchantID): Promise<boolean> {
    return orderController.changeStatusOrder(
      orderID,
      merchantID,
      orderController.ORDER_STATUS.CANCEL_BY_MERCHANT
    );
  }
}

const merchantController = new MerchantController();
export default merchantController;
