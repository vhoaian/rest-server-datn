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
};

export const Constants = {
  BCRYPT_SALT: bcryptJs.genSaltSync(10),
  PAGENATION: {
    PER_PAGE: 10,
    PAGES: 3,
  },
  CALL_API_ERROR: 20,
  SERVER: {
    CREATE_RES_ERROR: 100,
  },
};

export enum ERROR_CODE {
  SUCCESS = 0,
}
