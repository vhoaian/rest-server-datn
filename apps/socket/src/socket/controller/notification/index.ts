// Notification
// |- id: ObjectID
// |- Title: string
// |- SubTitle: string
// |- Receiver: ObjectID
// |- RoleReceiver: ["customer", "merchant", "shipper"]
// |- Thumbnail: string | null - url image thumbnail noti
// |- CreatedAt: Date

import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import { TAG_EVENT } from "../../TAG_EVENT";
import customerController from "../customer/customerController";
import merchantController from "../merchant/merchantController";
import shipperController from "../shipper/shipperController";
import { Notification as NotificationModel } from "@vohoaian/datn-models";

class NotificationController {
  private _TAG_LOG: string = "NOTIFICATION";
  private _TAG_LOG_FAIL: string = "NOTIFICATION_FAIL";

  private _ROLE: Array<string> = ["customer", "shipper", "merchant", "admin"];

  constructor() {}

  public async pushNotification(notificationID: string): Promise<void> {
    try {
      const notify = await NotificationModel.findOne({ _id: notificationID });

      if (!notify)
        return console.log(
          `[${this._TAG_LOG_FAIL}]: notification does not exits.`
        );

      const { Receiver } = notify.toObject();
      switch (this._ROLE[Receiver.Role]) {
        case "customer":
          this.pushNotiToCustomer(notify.toObject());
          break;
        case "merchant":
          this.pushNotiToMerchant(notify.toObject());
          break;
        case "shipper":
          this.pushNotiToShipper(notify.toObject());
          break;

        default:
          console.log(`[${this._TAG_LOG_FAIL}]: Role invalid.`);
          break;
      }
    } catch (e) {
      console.log(`[${this._TAG_LOG_FAIL}]: ${e.message}.`);
    }
  }

  private pushNotiToCustomer(notification: any): void {
    const socket = customerController.getSocket(notification.Receiver.Id);
    if (!socket)
      return console.log(`[${this._TAG_LOG_FAIL}]: customer not online`);

    socket.emit(
      TAG_EVENT.RESPONSE_NOTIFICATION,
      normalizeResponse("notification", notification)
    );
    console.log(`[${this._TAG_LOG}]: push notification success.`);
  }

  private pushNotiToMerchant(notification: any): void {
    const socket = merchantController.getSocket(notification.Receiver.Id);
    if (!socket)
      return console.log(`[${this._TAG_LOG_FAIL}]: merchant not online`);

    socket.emit(
      TAG_EVENT.RESPONSE_NOTIFICATION,
      normalizeResponse("notification", notification)
    );
    console.log(`[${this._TAG_LOG}]: push notification success.`);
  }

  private pushNotiToShipper(notification: any): void {
    const socket = shipperController.getSocket(notification.Receiver.Id);
    if (!socket)
      return console.log(`[${this._TAG_LOG_FAIL}]: shipper not online`);

    socket.emit(
      TAG_EVENT.RESPONSE_NOTIFICATION,
      normalizeResponse("notification", notification)
    );
    console.log(`[${this._TAG_LOG}]: push notification success.`);
  }
}

const notificationController = new NotificationController();
export default notificationController;
