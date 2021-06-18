import {
  Notification as NotificationModel,
  Shipper,
  Types,
} from "@vohoaian/datn-models";
import { INotificationDocument } from "@vohoaian/datn-models/lib/models/Notification";
import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import { TAG_EVENT } from "../../TAG_EVENT";
import customerController from "../customer/customerController";
import merchantController from "../merchant/merchantController";
import shipperController from "../shipper/shipperController";

class NotificationController {
  private _TAG_LOG: string = "NOTIFICATION";
  private _TAG_LOG_FAIL: string = "NOTIFICATION_FAIL";
  private _NOTI_SEND_SUCCESS = 1;

  private _ROLE: Array<string> = ["customer", "shipper", "merchant", "admin"];

  constructor() {}

  public async fetchAndPushNotification(userID: string) {
    const listNotification = await NotificationModel.find({
      Status: { $lt: 0 },
      "Receiver.Id": Types.ObjectId(userID),
    });

    for (const noti of listNotification) {
      await this.pushNotification(noti);
    }
  }

  public async pushNotification(
    notification: INotificationDocument
  ): Promise<void> {
    try {
      if (!notification) throw new Error("Notification does not exits");

      const { Receiver } = notification;
      let socket: any = null;

      switch (this._ROLE[Receiver.Role]) {
        case "customer":
          socket = customerController.getSocket(`${Receiver.Id}`);
          break;
        case "merchant":
          socket = merchantController.getSocket(`${Receiver.Id}`);
          break;
        case "shipper":
          socket = shipperController.getSocket(`${Receiver.Id}`);
          break;

        default:
          throw new Error("Role invalid");
          break;
      }

      if (socket === null) throw new Error("User not online");

      socket.emit(
        TAG_EVENT.RESPONSE_NOTIFICATION,
        normalizeResponse("notification", notification)
      );

      notification.Status = this._NOTI_SEND_SUCCESS;
      await notification.save();

      this.log(`Push notification success`);
    } catch (e) {
      this.logFail(`Push notification fail, ${e.message}`);
    }
  }

  public async pushNotificationByID(notificationID: string): Promise<void> {
    try {
      const notify = await NotificationModel.findById(notificationID);

      if (!notify) throw new Error("Notification does not exits");

      await this.pushNotification(notify);
    } catch (e) {
      this.logFail(`Push notification fail, ${e.message}`);
    }
  }

  private log(message: string): void {
    console.log(`[${this._TAG_LOG}]: ${message}`);
  }

  private logFail(message: string): void {
    console.log(`[${this._TAG_LOG_FAIL}]: ${message}`);
  }
}

const notificationController = new NotificationController();
export default notificationController;
