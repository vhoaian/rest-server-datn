import * as bcryptJs from "bcryptjs";

export const environment = {
  PORT: process.env.PORT || 8001,
  GOOGLE: {
    gclientID: process.env.GOOGLE_CLIENT_ID,
    gsecret: process.env.GOOGLE_SECRET,
    gCallBackURL: "/auth/google/redirect",
    defaultPass: "google",
    GEOCODE_API: "AIzaSyAFJZFUQOMyF3sKxY2Fs9_wouWC8AWLZYY", //"AIzaSyBfel2PZ2eQq5zuFGzL1Hmdx8zAJF15bwQ",
  },
  JWT: {
    secretKey: "final-project",
  },
  URL_SOCKET_SERVER: "http://localhost:8010",
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
    GET_USER_ERROR: 110,
    BLOCK_USER_ERROR: 111,
    CAN_NOT_FIND_USER: 112,
    GET_SHIPPER_ERROR: 120,
    LOGIN_ERROR: 150,
    EMAIL_INVAILD: 151,
    PASS_INVAILD: 152,
    GET_COMP_ERROR: 170,
    GET_CITY_ERROR: 180,
    GET_GENERAL_ERROR: 190,
    GET_NOTICE_ERROR: 191,
    CREATE_SHIPPER_ERROR: 192,
    PAY_RECEIPT_ERROR: 193,
    HANDLE_WITHDRAW_ERROR: 194,
    GET_WITHDRAW_ERROR: 195,
  },
  PAID: {
    RESOLVE: 1,
    UNRESOLVE: -1,
  },
  ROLE: {
    CUSTOMER: 0,
    SHIPPER: 1,
    RESTAURANT: 2,
    ADMIN: 3,
  },
  STATUS_ACCOUNT: {
    LOCK: -2,
    UNLOCK: 1,
  },
};

export enum ERROR_CODE {
  SUCCESS = 0,
}

export default environment;
