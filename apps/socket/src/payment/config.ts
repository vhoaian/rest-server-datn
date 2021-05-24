/*

// ** Account integrate ** \\
\\ *********************** //
    |- Website login : https://sbmc.zalopay.vn
    |- Account       : 0925226173
    |- Password      : Z@lopay123
    |- AppID         : 2554
    |- Key1          : sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn
    |- Key2          : trMrHtvjo6myautxDUiAcYsVtaeQ8nhf
    
*/

import config from "../config";

export const appid = config.ZALO_PAY.appid || 2554;
export const key1 = config.ZALO_PAY.key1 || "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn";
export const key2 = config.ZALO_PAY.key2 || "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf";
export const api = {
  createorder: "https://sb-openapi.zalopay.vn/v2/create",
  gateway: "https://sbgateway.zalopay.vn/openinapp?order",
  quickpay: "https://sb-openapi.zalopay.vn/v2/quick_pay",
  refund: "https://sb-openapi.zalopay.vn/v2/refund",
  getrefundstatus: "https://sb-openapi.zalopay.vn/v2/query_refund",
  getorderstatus: "https://sb-openapi.zalopay.vn/v2/query",
  getbanklist: "https://sbgateway.zalopay.vn/api/getlistmerchantbanks",
};
