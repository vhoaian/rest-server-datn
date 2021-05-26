import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import config from "../../../config";
import { TAG_EVENT } from "../../TAG_EVENT";
import orderController from "../order";

class MerchantController {
  private _listMetchantOnline: Array<any> = [];
  private _io: any = null;
  private static MERCHANT_DEFAULT: any = {
    id: null,
    socketID: null,
    listOrderID: [],
  };

  constructor() {
    // Log list customer online
    if (config.LOG_SOCKET.indexOf("merchant") > -1)
      setInterval(() => {
        console.log("LIST MERCHANT ONLINE");
        console.table(this._listMetchantOnline);
      }, 5000);
  }

  setIO(io) {
    this._io = io;
  }

  addMerchant = (id, socketID) => {
    this._listMetchantOnline.push({
      ...MerchantController.MERCHANT_DEFAULT.clone(),
      id,
      socketID,
    });
  };

  getMerchant(id): any {
    return (
      this._listMetchantOnline.find((merchant) => merchant.id === id) || null
    );
  }

  getSocket(merchantID) {
    return this._io
      .of("/")
      .sockets.get(`${this.getMerchant(merchantID).socketID}`);
  }

  removeMerchant(id) {
    const index = this._listMetchantOnline.findIndex(
      (merchant) => merchant.id === id
    );
    if (index < 0) return;

    this._listMetchantOnline.splice(index, 1);
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
