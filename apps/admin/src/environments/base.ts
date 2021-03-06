import * as bcryptJs from "bcryptjs";

const GG_API_LIST = [
  "AIzaSyAqt8_rMqOUdY7TH-uDLD-dpbRTXyzV81c",
  "AIzaSyCqS3ShhDrlYA_lU890nqHKRxnovg8y8JU",
  "AIzaSyBJfY1DIgMkxCZqxMI-dEsH89fBBcghmf8",
  "AIzaSyAFJZFUQOMyF3sKxY2Fs9_wouWC8AWLZYY",
  "AIzaSyBfel2PZ2eQq5zuFGzL1Hmdx8zAJF15bwQ",
];

export const environment = {
  PORT: process.env.PORT || 8001,
  GOOGLE: {
    gclientID: process.env.GOOGLE_CLIENT_ID,
    gsecret: process.env.GOOGLE_SECRET,
    gCallBackURL: "/auth/google/redirect",
    defaultPass: "google",
    GEOCODE_API: GG_API_LIST[0],
  },
  JWT: {
    secretKey: "final-project",
  },
  // URL_SOCKET_SERVER: "http://localhost:8010",
  URL_SOCKET_SERVER: "http://192.168.1.4:8010",
  THUMB_WITHDRAW: "",
  THUMB_NOTI_FEEAPP: "",
};

export const Constants = {
  BCRYPT_SALT: bcryptJs.genSaltSync(10),
  PAGENATION: {
    PER_PAGE: 10,
    PAGES: 3,
  },
  CALL_API_ERROR: 20,
  SERVER: {
    INVALID_PARAM: 99,
    CREATE_RES_ERROR: 100,
    GET_RES_ERROR: 101,
    DELETE_RES_ERROR: 102,
    UPDATE_RES_ERROR: 104,
    FIND_RES_ERROR: 103,
    RES_EXISTS: 105,
    UPDATE_PERMISION_ERROR: 106,
    RECALL_PERMISION_ERROR: 107,
    GET_USER_ERROR: 110,
    BLOCK_USER_ERROR: 111,
    CAN_NOT_FIND_USER: 112,
    GET_SHIPPER_ERROR: 120,
    UPDATE_ORDER_ERROR: 121,
    CAN_NOT_FIND_ORDER: 122,
    CREATE_SHIPPER_ERROR: 123,
    PAY_RECEIPT_ERROR: 130,
    HANDLE_WITHDRAW_ERROR: 140,
    GET_WITHDRAW_ERROR: 141,
    LOGIN_ERROR: 150,
    EMAIL_INVAILD: 151,
    PASS_INVAILD: 152,
    GET_COMP_ERROR: 170,
    SOLVE_COMP_ERROR: 171,
    GET_CITY_ERROR: 180,
    GET_SETTING_ERROR: 181,
    UPDATE_SETTING_ERROR: 182,
    GET_GENERAL_ERROR: 190,
    GET_NOTICE_ERROR: 191,
  },
  PAID: {
    RESOLVE: 1,
    CANCEL: 0,
    UNRESOLVE: -1,
  },
  ROLE: {
    CUSTOMER: 0,
    SHIPPER: 1,
    RESTAURANT: 2,
    ADMIN: 3,
  },
  STATUS: {
    BLOCK: -2,
    NORMAL: 0,
    UNCHECK: -1,
  },

  RESTAURANT: {
    STOP_SERVICE: -1,
    OPEN_SERVICE: 1,
    AVATAR:
      "https://drive.google.com/uc?id=1j0mrKqcvWde5WDyKTb8GKwfZpUrn0nWp&export=download",
  },
  STATUS_ACCOUNT: {
    LOCK: -2,
    UNLOCK: 0,
  },
  PASS_LENGTH: 8,
  ORDER_STATUS: {
    WAITING_PAYMENT: 0,
    WAITING: 1,
    MERCHANT_CONFIRM: 2,
    DURING_GET: 3,
    DURING_SHIP: 4,
    DELIVERED: 5,
    CANCEL_BY_CUSTOMER: 6,
    CANCEL_BY_MERCHANT: 7,
    CANCEL_BY_SHIPPER: 8,
    BOOM: 9,
  },
};

export enum ERROR_CODE {
  SUCCESS = 0,
}

export default environment;
