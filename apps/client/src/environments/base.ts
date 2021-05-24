import * as bcryptJs from "bcryptjs";

export const environment = {
  PORT: process.env.port || 8000,
  GOOGLE: {
    gclientID: process.env.GOOGLE_CLIENT_ID,
    gsecret: process.env.GOOGLE_SECRET,
    gCallBackURL: "/auth/google/redirect",
    defaultPass: "google",
  },
  JWT: {
    secretKey: "final-project",
  },
  URL_SOCKET_SERVER: "http://localhost:8010",
  BCRYPT_SALT: bcryptJs.genSaltSync(10),
};

export enum ERROR_CODE {
  SUCCESS = 0,
}
