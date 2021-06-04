import { Order, Restaurant, Shipper } from "@vohoaian/datn-models";
import axios from "axios";
import config from "../environments/base";
import {
  Receipt as ReceiptModel,
  Notification as NotificationModel,
} from "@vohoaian/datn-models";
import mongoose from "mongoose";

// Receipt
// |- id: ObjectID
// |- Payer: ObjectID: [Restaurant, Shipper]
// |- FeeTotal: number
// |- PercentFee: number - Phần trăm phí áp dụng
// |- Status: number [0: unpaid, 1: paid]
// |- DateStart: Date
// |- DateEnd: Date
// |- CreatedAt: Date

const ORDER_STATUS = {
  WAITING_PAYMENT: 0,
  WAITING: 1,
  MERCHANT_CONFIRM: 2,
  DURING_GET: 3,
  DURING_SHIP: 4,
  DELIVERED: 5,
  CANCEL_BY_CUSTOMER: 6,
  CANCEL_BY_MERCHANT: 7,
  CANCEL_BY_SHIPPER: 8,
};

class AutoCalcReceipt {
  private _TIMER_CALC_RECEIPT: number = 0;
  private _TIMER_AUTO_LOCK_ACC: number = 0;
  private _TIME_SKIP: number = 1000 * 5; // unit sencond

  private _PERCENT_FEE_SHIPPER: number = 10; // unit %
  private _PERCENT_FEE_MERCHANT: number = 10; // unit %

  private _STATUS_NOT_PAID: number = 0;
  private _STATUS_PAID: number = 1;
  private _DAY_DELAY_PAY_RECEIPT: number = 14;
  private _STATUS_LOCK_ACC: number = -1;

  private _TAG_LOG_SUCCESS: string = "AUTO_CALC_RECEIPT";
  private _TAG_LOG_FAILED: string = "AUTO_CALC_RECEIPT_FAILED";

  private _ROLE: Array<string> = ["customer", "shipper", "merchant", "admin"];

  constructor() {}

  public runAutoCalcReceipt(): void {
    console.log(`[${this._TAG_LOG_SUCCESS}]: autoCalcReceipt run`);

    this._TIMER_CALC_RECEIPT = new Date().getTime();

    setInterval(() => {
      this._TIMER_CALC_RECEIPT += this._TIME_SKIP;

      // Date test: "Mon May 31 2021 22:59:00 GMT+0700 (Indochina Time)"
      if (!this.checkEndDayEndMonth(new Date(this._TIMER_CALC_RECEIPT))) return;

      // run calc receipt
      this.calcReceipt();
    }, this._TIME_SKIP);
    this.calcReceipt();
  }

  public runAutoLockLatePayReceipt(): void {
    console.log(`[${this._TAG_LOG_SUCCESS}]: AutoLockLatePayReceipt run`);

    this._TIMER_AUTO_LOCK_ACC = new Date().getTime();

    setInterval(() => {
      this._TIMER_AUTO_LOCK_ACC += this._TIME_SKIP;

      // Date test: "Mon May 31 2021 22:59:00 GMT+0700 (Indochina Time)"
      if (!this.checkEndDay(new Date(this._TIMER_AUTO_LOCK_ACC).getHours()))
        return;

      // run calc receipt
      this.lockAccount();
    }, this._TIME_SKIP);
  }

  private async lockAccount(): Promise<void> {
    // Get all receipt not paid
    const _listReceiptNotPaid = await ReceiptModel.find({
      Status: this._STATUS_NOT_PAID,
    });
    // const _listReceiptNotPaid: Array<{ CreatedAt: Date; Payer: string }> = [];
    _listReceiptNotPaid.forEach((receipt) => {
      const dayLeft =
        (new Date().getTime() - receipt.CreatedAt.getTime()) /
        (24 * 60 * 60 * 1000);
      if (dayLeft >= this._DAY_DELAY_PAY_RECEIPT) {
        // Lock acc
        Restaurant.updateOne(
          { _id: `${receipt.Payer.Id}` },
          { Status: this._STATUS_LOCK_ACC }
        );

        Shipper.updateOne(
          { _id: `${receipt.Payer.Id}` },
          { Status: this._STATUS_LOCK_ACC }
        );
      }
    });
  }

  private calcReceipt(): void {
    console.log(`[${this._TAG_LOG_SUCCESS}]: start run calc receipt`);

    const currDate = new Date(this._TIMER_CALC_RECEIPT);
    const day = currDate.getDate();
    const month = currDate.getMonth() + 1;
    const year = currDate.getFullYear();

    const { dateStart, dateEnd } = this.calcDateStartEnd(day, month, year);
    this.calcReceiptShipper(dateStart, dateEnd);
    this.calcReceiptMerchant(dateStart, dateEnd);
  }

  private async calcReceiptShipper(
    dateStart: Date,
    dateEnd: Date
  ): Promise<void> {
    console.log(
      `[${this._TAG_LOG_SUCCESS}]: start run calc receipt for shipper`
    );
    try {
      const _allShipper = await Shipper.find({});

      const listPromise = _allShipper.reduce(
        (_listPromise: any, _currShipper) => {
          _listPromise.push(
            this.calcFeeForShipper(_currShipper._id, dateStart, dateEnd)
          );
          return _listPromise;
        },
        []
      );

      await Promise.all(listPromise);
      console.log(
        `[${this._TAG_LOG_SUCCESS}]: calc receipt for shipper success`
      );
    } catch (e) {
      console.log(
        `[${this._TAG_LOG_FAILED}]: calc receipt for shipper failed.`,
        e.message
      );
    }
  }

  private async calcReceiptMerchant(
    dateStart: Date,
    dateEnd: Date
  ): Promise<void> {
    console.log(
      `[${this._TAG_LOG_SUCCESS}]: start run calc receipt for Merchant`
    );
    try {
      const _allMerchant = await Restaurant.find({});

      const listPromise = _allMerchant.reduce(
        (_listPromise: any, _currMerchant) => {
          _listPromise.push(
            this.calcFeeForMerchant(_currMerchant._id, dateStart, dateEnd)
          );
          return _listPromise;
        },
        []
      );

      await Promise.all(listPromise);
      console.log(
        `[${this._TAG_LOG_SUCCESS}]: calc receipt for merchant success`
      );
    } catch (e) {
      console.log(
        `[${this._TAG_LOG_FAILED}]: calc receipt for merchant failed.`,
        e.message
      );
    }
  }

  private async calcFeeForShipper(
    shipperID: string,
    dateStart: Date,
    dateEnd: Date
  ): Promise<void> {
    console.log("shipperID:", shipperID);
    // Get all Order in Month
    const _allOrder = await Order.find({
      Shipper: mongoose.Types.ObjectId(shipperID),
      Status: {
        $nin: [
          ORDER_STATUS.CANCEL_BY_CUSTOMER,
          ORDER_STATUS.CANCEL_BY_MERCHANT,
          ORDER_STATUS.CANCEL_BY_SHIPPER,
        ],
      },
      CreatedAt: { $gt: dateStart, $lt: dateEnd },
    });

    console.log("_allOrder.length:", _allOrder.length);
    console.log("shipperID:", shipperID);

    // Calc fee
    const _feeApp: number = _allOrder.reduce((totalFee, currOrder) => {
      totalFee += currOrder.ShippingFee * (this._PERCENT_FEE_SHIPPER / 100);
      return totalFee;
    }, 0);

    // Create receipt and notification
    const dataReceipt = {
      Payer: {
        Id: mongoose.Types.ObjectId(shipperID),
        Role: this._ROLE.indexOf("shipper"),
      },
      FeeTotal: _feeApp,
      PercentFee: this._PERCENT_FEE_SHIPPER / 100,
      Status: _feeApp > 0 ? this._STATUS_NOT_PAID : this._STATUS_PAID,
      DateStart: dateStart,
      DateEnd: dateEnd,
    };
    const newReceipt = new ReceiptModel(dataReceipt);
    newReceipt.save();

    const dataNoti = {
      Title: `Thông báo thanh toán tiền tháng ${dateEnd.getMonth() + 1}`,
      Subtitle: `Thanh toán hóa đơn phí thuê app, tổng số tiền bạn cần phải trả là ${_feeApp}đ`,
      Receiver: {
        Id: mongoose.Types.ObjectId(shipperID),
        Role: this._ROLE.indexOf("shipper"),
      },
    };

    const notification = new NotificationModel(dataNoti);
    await notification.save();

    // const notification = { _id: "123" };

    this.pushNotification(notification._id);
    console.log("FEE APP FOR SHIPPER:", _feeApp);
  }

  private async calcFeeForMerchant(
    merchantID: string,
    dateStart: Date,
    dateEnd: Date
  ): Promise<void> {
    // Get all Order in Month
    const _allOrder = await Order.find({
      Restaurant: mongoose.Types.ObjectId(merchantID),
      Status: {
        $nin: [
          ORDER_STATUS.CANCEL_BY_CUSTOMER,
          ORDER_STATUS.CANCEL_BY_MERCHANT,
          ORDER_STATUS.CANCEL_BY_SHIPPER,
        ],
      },
      CreatedAt: { $gt: dateStart, $lt: dateEnd },
    });

    // Calc fee
    const _feeApp: number = _allOrder.reduce((totalFee, currOrder) => {
      totalFee +=
        (currOrder.Total - currOrder.ShippingFee) *
        (this._PERCENT_FEE_MERCHANT / 100);
      return totalFee;
    }, 0);

    // Create receipt and notification
    const dataReceipt = {
      Payer: {
        Id: mongoose.Types.ObjectId(merchantID),
        Role: this._ROLE.indexOf("merchant"),
      },
      FeeTotal: _feeApp,
      PercentFee: this._PERCENT_FEE_MERCHANT / 100,
      Status: _feeApp > 0 ? this._STATUS_NOT_PAID : this._STATUS_PAID,
      DateStart: dateStart,
      DateEnd: dateEnd,
    };
    const newReceipt = new ReceiptModel(dataReceipt);
    newReceipt.save();

    const dataNoti = {
      Title: `Thông báo thanh toán tiền tháng ${dateEnd.getMonth() + 1}`,
      Subtitle: `Thanh toán hóa đơn phí thuê app, tổng số tiền bạn cần phải trả là ${_feeApp}đ`,
      Receiver: {
        Id: mongoose.Types.ObjectId(merchantID),
        Role: this._ROLE.indexOf("merchant"),
      },
    };

    const notification = new NotificationModel(dataNoti);
    await notification.save();

    // const notification = { _id: "123" };

    this.pushNotification(notification._id);
    console.log("FEE APP FOR MERCHANT:", _feeApp);
  }

  private async pushNotification(notificationID: string): Promise<void> {
    try {
      const body = {
        notificationID,
      };

      axios.post(`${config.URL_SOCKET_SERVER}/notification`, body, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (e) {}
  }

  private checkLeapYear(year: number): boolean {
    if (year % 4 === 0 && year % 100 !== 0) return true;
    if (year % 400 === 0) return true;
    return false;
  }

  private calcLastDayOfMonth(month: number, year: number): number {
    const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    daysInMonth[2] += this.checkLeapYear(year) ? 1 : 0;
    return daysInMonth[month];
  }

  private checkLastDayOfMonth(day: number, month: number, year: number) {
    return day === this.calcLastDayOfMonth(month, year);
  }

  private checkEndDay(hour: number): boolean {
    return 23 <= hour;
  }

  private checkEndDayEndMonth(date: Date): boolean {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();

    if (!this.checkLastDayOfMonth(day, month, year)) return false;
    if (!this.checkEndDay(hours)) return false;
    return true;
  }

  private calcDateStartEnd(
    day: number,
    month: number,
    year: number
  ): { dateStart: Date; dateEnd: Date } {
    const dateStart = new Date();
    const dateEnd = new Date();

    dateStart.setDate(1);
    dateStart.setMonth(month - 1);
    dateStart.setFullYear(year);
    dateStart.setHours(0, 0, 0, 1);

    dateEnd.setDate(day);
    dateEnd.setMonth(month - 1);
    dateEnd.setFullYear(year);
    dateEnd.setHours(23, 59, 59, 999);

    return { dateStart, dateEnd };
  }
}

const autoCalcReceipt = new AutoCalcReceipt();
export default autoCalcReceipt;
