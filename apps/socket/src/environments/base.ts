import * as bcryptJs from "bcryptjs";

export const environment = {
  PORT: process.env.port || 8010,
  GOOGLE: {
    gclientID: process.env.GOOGLE_CLIENT_ID,
    gsecret: process.env.GOOGLE_SECRET,
    gCallBackURL: "/auth/google/redirect",
    defaultPass: "google",
  },
  JWT: {
    secretKey: "final-project",
  },
  BCRYPT_SALT: bcryptJs.genSaltSync(10),
  URL_SERVER: "",
  ZALO_PAY: {
    appid: 2554,
    key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
    key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
  },
};

export enum ERROR_CODE {
  SUCCESS = 0,
}
