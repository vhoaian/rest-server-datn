import {
  Manager,
  Notification as NotificationModel,
  Order,
  Receipt as ReceiptModel,
  Restaurant,
  Setting,
  Shipper,
} from "@vohoaian/datn-models";
import { Constants, environment } from "../environments/base";
import mailController from "../mail/mailController";
import { pushNotification } from "../notification";

class AutoCalcReceipt {
  private _TIMER_CALC_RECEIPT: number = 0;
  private _TIMER_LOCK_ACC: number = 0;
  private _TIME_SKIP: number = 1000 * 60 * 10; // unit milisencond

  private _PERCENT_FEE_SHIPPER: number = 10; // unit %
  private _PERCENT_FEE_MERCHANT: number = 10; // unit %
  private _DAY_DELAY_PAY_RECEIPT: number = 14;

  constructor() {}

  private log(message: string): void {
    console.log(`[AUTO_CALC_RECEIPT]: ${message}`);
  }
  private logFail(message: string): void {
    console.log(`[AUTO_CALC_RECEIPT_FAIL]: ${message}`);
  }

  private async fetchLatestSetting() {
    const setting = await Setting.findOne({});
    this._PERCENT_FEE_MERCHANT = setting.PercentFeeMerchant;
    this._PERCENT_FEE_SHIPPER = setting.PercentFeeShipper;
    this._DAY_DELAY_PAY_RECEIPT = setting.MAX_DAY_DELAY_PAY_RECEIPT;
  }

  public runAutoCalcReceipt(): void {
    this.log("autoCalcReceipt run");
    this._TIMER_CALC_RECEIPT = new Date().getTime();

    setInterval(async () => {
      this._TIMER_CALC_RECEIPT += this._TIME_SKIP;
      if (Helper.checkEndDayEndMonth(new Date(this._TIMER_CALC_RECEIPT))) {
        await this.fetchLatestSetting();
        this.calcReceipt();
      }
    }, this._TIME_SKIP);
  }

  public runAutoLockLatePayReceipt(): void {
    this.log("autoLockLatePayReceipt run");
    this._TIMER_LOCK_ACC = new Date().getTime();

    setInterval(async () => {
      this._TIMER_LOCK_ACC += this._TIME_SKIP;
      // Date test: "Mon May 31 2021 22:59:00 GMT+0700 (Indochina Time)"
      if (Helper.checkEndDay(new Date(this._TIMER_LOCK_ACC).getHours())) {
        await this.fetchLatestSetting();
        this.lockAccount();
      }
    }, this._TIME_SKIP);
  }

  private async lockAccount(): Promise<void> {
    console.log("LOCK ACCOUNT");
    try {
      // Get all receipt not paid
      const _listReceiptNotPaid = await ReceiptModel.find({
        Status: Constants.PAID.UNRESOLVE,
      });

      for (const receipt of _listReceiptNotPaid) {
        const dayLeft =
          (new Date().getTime() - receipt.CreatedAt.getTime()) /
          (24 * 60 * 60 * 1000);

        if (dayLeft >= this._DAY_DELAY_PAY_RECEIPT) {
          const user: any =
            receipt.Payer.Role === Constants.ROLE.SHIPPER
              ? await Shipper.findOne({
                  _id: receipt.Payer.Id,
                  Status: Constants.STATUS_ACCOUNT.UNLOCK,
                })
              : await Manager.findOne({
                  "Roles.Restaurant": receipt.Payer.Id,
                  Status: Constants.STATUS_ACCOUNT.UNLOCK,
                });

          if (user) {
            user.Status = Constants.STATUS_ACCOUNT.LOCK;
            await user.save();

            const email = user?.Email;
            if (email) {
              await mailController.sendMailLockAccount(user.FullName, email);
            }

            if (receipt.Payer.Role === Constants.ROLE.RESTAURANT) {
              const restaurantID = user.Roles[0].Restaurant;
              const restaurant = await Restaurant.findById(restaurantID);
              if (restaurant) {
                restaurant.Status = Constants.RESTAURANT.STOP_SERVICE;
                restaurant.save();
              }
            }
          }
        }
      }
    } catch (e) {
      this.logFail(`lock account fail, ${e.message}`);
    }
  }

  private calcReceipt(): void {
    this.log("start run calc receipt");

    const currDate = new Date(this._TIMER_CALC_RECEIPT);
    const day = currDate.getDate();
    const month = currDate.getMonth() + 1;
    const year = currDate.getFullYear();

    const { dateStart, dateEnd } = Helper.calcDateStartEnd(day, month, year);
    this.calcReceiptShipper(dateStart, dateEnd);
    this.calcReceiptMerchant(dateStart, dateEnd);
  }

  private async calcReceiptShipper(
    dateStart: Date,
    dateEnd: Date
  ): Promise<void> {
    this.log("start run calc receipt for shipper");
    try {
      const _allShipper = await Shipper.find({});

      const listPromise = _allShipper.reduce((_lsPrms: any, _s) => {
        _lsPrms.push(this.calcFee(_s, dateStart, dateEnd, 1));
        return _lsPrms;
      }, []);

      await Promise.all(listPromise);
      this.log("calc receipt for shipper success");
    } catch (e) {
      this.logFail(`calc receipt for shipper failed, ${e.message}`);
    }
  }

  private async calcReceiptMerchant(
    dateStart: Date,
    dateEnd: Date
  ): Promise<void> {
    this.log("start run calc receipt for Merchant");
    try {
      const _allMerchant = await Restaurant.find({ IsPartner: true });

      const listPromise = _allMerchant.reduce((_lsPrms: any, _m) => {
        _lsPrms.push(this.calcFee(_m, dateStart, dateEnd, 2));
        return _lsPrms;
      }, []);

      await Promise.all(listPromise);
      this.log("calc receipt for merchant success");
    } catch (e) {
      this.logFail(`calc receipt for merchant failed, ${e.message}`);
    }
  }

  private async calcFee(
    user: any,
    dateStart: Date,
    dateEnd: Date,
    role: 1 | 2
  ): Promise<void> {
    // Get all Order in Month
    const _allOrder = await Order.find({
      Shipper: user._id,
      Status: {
        $nin: [
          Constants.ORDER_STATUS.CANCEL_BY_CUSTOMER,
          Constants.ORDER_STATUS.CANCEL_BY_MERCHANT,
          Constants.ORDER_STATUS.CANCEL_BY_SHIPPER,
        ],
      },
      CreatedAt: { $gt: dateStart, $lt: dateEnd },
    });

    const percentFee =
      role === Constants.ROLE.SHIPPER
        ? this._PERCENT_FEE_SHIPPER
        : this._PERCENT_FEE_MERCHANT;

    // Create receipt and notification
    const dataReceipt = {
      Payer: {
        Id: user._id,
        Role: role,
      },
      FeeTotal: 0,
      PercentFee: percentFee / 100,
      Status: Constants.PAID.UNRESOLVE,
      DateStart: dateStart,
      DateEnd: dateEnd,
    };

    const oldReceipt = await ReceiptModel.findOne({
      "Payer.Id": user._id,
      Status: Constants.PAID.UNRESOLVE,
    });

    const oldFee = oldReceipt?.FeeTotal || 0;
    const receipt = oldReceipt ? oldReceipt : new ReceiptModel(dataReceipt);

    // Calc fee
    const _feeAppBefore =
      role === Constants.ROLE.SHIPPER
        ? _allOrder.reduce((fee, order) => {
            return fee + order.ShippingFee * (percentFee / 100);
          }, 0)
        : _allOrder.reduce((fee, order) => {
            return fee + (order.Total - order.ShippingFee) * (percentFee / 100);
          }, 0);

    let _feeAppAfter = user.Wallet - _feeAppBefore - oldFee;

    if (_feeAppAfter >= 0) {
      user.Wallet -= _feeAppBefore;
      _feeAppAfter = 0;
    } else {
      user.Wallet = 0;
      _feeAppAfter *= -1;
    }

    receipt.FeeTotal = _feeAppAfter;
    receipt.Status =
      _feeAppAfter > 0 ? Constants.PAID.UNRESOLVE : Constants.PAID.RESOLVE;

    const notification = new NotificationModel({
      Title: `Thông báo thanh toán tiền tháng ${dateEnd.getMonth() + 1}`,
      Subtitle: `Thanh toán hóa đơn phí thuê app, tổng phí của bạn là ${_feeAppBefore}, tổng số tiền bạn cần phải trả là ${_feeAppAfter}đ. Vui lòng đóng phí trong vòng ${this._DAY_DELAY_PAY_RECEIPT} ngày kể từ khi nhận thông báo này.`,
      Receiver: {
        Id: user._id,
        Role: role,
      },
      Thumbnail: environment.THUMB_NOTI_FEEAPP,
    });

    const sendMail = mailController.sendMailOption(
      user.FullName,
      user.Email,
      `Thông báo thanh toán tiền tháng ${dateEnd.getMonth() + 1}.`,
      `Thanh toán hóa đơn phí thuê app, tổng phí của bạn là ${_feeAppBefore}, tổng số tiền bạn cần phải trả là ${_feeAppAfter}đ. Vui lòng đóng phí trong vòng ${this._DAY_DELAY_PAY_RECEIPT} ngày kể từ khi nhận thông báo này. Hệ thống sẽ tự động khóa tài khoản của bạn sau ${this._DAY_DELAY_PAY_RECEIPT} ngày nếu như bạn chưa đóng phi.`,
      "vn"
    );

    await Promise.all([
      receipt.save(),
      notification.save(),
      user.save(),
      sendMail,
    ]);

    pushNotification(notification._id);
  }
}

const autoCalcReceipt = new AutoCalcReceipt();
export default autoCalcReceipt;

/*
  HELPER
*/

class Helper {
  public static checkLeapYear(year: number): boolean {
    if (year % 4 === 0 && year % 100 !== 0) return true;
    if (year % 400 === 0) return true;
    return false;
  }

  public static calcLastDayOfMonth(month: number, year: number): number {
    const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    daysInMonth[2] += this.checkLeapYear(year) ? 1 : 0;
    return daysInMonth[month];
  }

  public static checkLastDayOfMonth(
    day: number,
    month: number,
    year: number
  ): boolean {
    return day === this.calcLastDayOfMonth(month, year);
  }

  public static checkEndDay(hour: number): boolean {
    return 23 <= hour;
  }

  public static checkEndDayEndMonth(date: Date): boolean {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();

    if (!this.checkLastDayOfMonth(day, month, year)) return false;
    if (!this.checkEndDay(hours)) return false;
    return true;
  }

  public static calcDateStartEnd(
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
