const CryptoJS = require("crypto-js");
const config = require("./config");

class Mac {
  Compute(data): string {
    return CryptoJS.HmacSHA256(data, config.key1).toString();
  }

  _createOrderMacData(order): string {
    return (
      order.appid +
      "|" +
      order.apptransid +
      "|" +
      order.appuser +
      "|" +
      order.amount +
      "|" +
      order.apptime +
      "|" +
      order.embeddata +
      "|" +
      order.item
    );
  }

  CreateOrder(order): string {
    return this.Compute(this._createOrderMacData(order));
  }

  QuickPay(order, paymentcodeRaw): string {
    return this.Compute(this._createOrderMacData(order) + "|" + paymentcodeRaw);
  }

  Refund(params): string {
    return this.Compute(
      params.appid +
        "|" +
        params.zptransid +
        "|" +
        params.amount +
        "|" +
        params.description +
        "|" +
        params.timestamp
    );
  }

  GetOrderStatus(params): string {
    return this.Compute(
      params.appid + "|" + params.apptransid + "|" + config.key1
    );
  }

  GetRefundStatus(params): string {
    return this.Compute(
      params.appid + "|" + params.mrefundid + "|" + params.timestamp
    );
  }

  GetBankList(params): string {
    return this.Compute(params.appid + "|" + params.reqtime);
  }
}

const mac = new Mac();

export default mac;
