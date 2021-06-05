import * as bcryptJs from "bcryptjs";

export const environment = {
  PORT: process.env.port || 8001,
  GOOGLE: {
    gclientID: process.env.GOOGLE_CLIENT_ID,
    gsecret: process.env.GOOGLE_SECRET,
    gCallBackURL: "/auth/google/redirect",
    defaultPass: "google",
    GEOCODE_API: "AIzaSyBfel2PZ2eQq5zuFGzL1Hmdx8zAJF15bwQ",
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
    FIND_RES_ERROR: 103,
    GET_USER_ERROR: 110,
    BLOCK_USER_ERROR: 111,
    CAN_NOT_FIND_USER: 112,
    GET_SHIPPER_ERROR: 120,
    GET_GENERAL_ERROR: 190,
    GET_NOTICE_ERROR: 191,
  },
  PAID: {
    RESOLVE: 1,
    UNRESOLVE: -1,
  },
};

export enum ERROR_CODE {
  SUCCESS = 0,
}

export default environment;
