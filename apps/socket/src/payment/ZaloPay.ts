import fs from "fs";
import NodeRSA from "node-rsa";
import axios from "axios";
import CryptoJS from "crypto-js";
import moment from "moment";
import path from "path";

import * as config from "./config";
import Mac from "./Mac";
import configApp from "../config";

const pathPublicKey: string = path.join(
  __dirname.replace("/dist", ""),
  "src",
  "payment",
  "publickey.pem"
);
const publicKey: string = fs.readFileSync(pathPublicKey, "utf8");
const rsa = new NodeRSA(publicKey, {
  encryptionScheme: "pkcs1",
});

let uid = Date.now();

class ZaloPay {
  private publicURL: string;

  constructor() {
    this.publicURL = configApp.URL_SERVER;
  }

  VerifyCallback(data, requestMac) {
    const result: any = {};
    const mac = CryptoJS.HmacSHA256(data, config.key2).toString();

    if (mac !== requestMac) {
      result.return_code = -1;
      result.return_message = "mac not equal";
    } else {
      result.return_code = 1;
      result.return_message = "success";
    }

    return result;
  }

  GenTransID() {
    return `${moment().format("YYMMDD")}_${config.appid}_${++uid}`;
  }

  NewOrder({ order }: any) {
    console.log("NEW ORDER: ", order._id);

    const amount: number = order.Total || 0;
    const description: string = `Pay for order ${order._id}`;
    const app_trans_id: string = this.GenTransID();

    const self: any = this;
    return {
      amount,
      description,
      app_id: config.appid,
      app_user: "Demo",
      embed_data: JSON.stringify({
        description,
        orderID: order._id,
        tool: order.Tool,
      }),
      item: JSON.stringify([]),
      app_time: Date.now(),
      app_trans_id,
      callback_url: `${this.publicURL}/callback-zalopay`,
      bank_code: "zalopayapp",
    };
  }

  async CreateOrder(params: any = {}) {
    const order: any = this.NewOrder(params);
    order.mac = Mac.CreateOrder(order);

    const { data: result } = await axios.post(config.api.createorder, null, {
      params: order,
    });

    result.app_trans_id = order.app_trans_id;
    return result;
  }

  Gateway(params: any = {}) {
    const order: any = this.NewOrder(params);
    order.mac = Mac.CreateOrder(order);

    const orderJSON = JSON.stringify(order);
    const b64Order = Buffer.from(orderJSON).toString("base64");
    return config.api.gateway + encodeURIComponent(b64Order);
  }

  async QuickPay(params: any = {}) {
    const order: any = this.NewOrder(params);
    order.userip = "127.0.0.1";
    order.paymentcode = rsa.encrypt(params.paymentcodeRaw, "base64");
    order.mac = Mac.QuickPay(order, params.paymentcodeRaw);

    const { data: result } = await axios.post(config.api.quickpay, null, {
      params: order,
    });

    result.apptransid = order.apptransid;
    return result;
  }

  async GetOrderStatus(apptransid = "") {
    const params: any = {
      appid: config.appid,
      apptransid,
    };
    params.mac = Mac.GetOrderStatus(params);

    const { data: result } = await axios.post(config.api.getorderstatus, null, {
      params,
    });

    return result;
  }

  async Refund({ zptransid, amount, description }) {
    const refundReq: any = {
      appid: config.appid,
      zptransid,
      amount,
      description,
      timestamp: Date.now(),
      mrefundid: this.GenTransID(),
    };

    refundReq.mac = Mac.Refund(refundReq);

    const { data: result } = await axios.post(config.api.refund, null, {
      params: refundReq,
    });

    result.mrefundid = refundReq.mrefundid;
    return result;
  }

  async GetRefundStatus(mrefundid) {
    const params: any = {
      appid: config.appid,
      mrefundid,
      timestamp: Date.now(),
    };

    params.mac = Mac.GetRefundStatus(params);

    const { data: result } = await axios.post(
      config.api.getrefundstatus,
      null,
      {
        params,
      }
    );

    return result;
  }

  async GetBankList() {
    const params: { appid: number; reqtime: number; mac: string } = {
      appid: config.appid,
      reqtime: Date.now(),
      mac: "",
    };

    params.mac = Mac.GetBankList(params);

    const { data: result } = await axios.post(config.api.getbanklist, null, {
      params,
    });

    return result;
  }
}

const zaloPay = new ZaloPay();
export default zaloPay;
