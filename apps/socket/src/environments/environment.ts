import { environment as base } from "./base";

export const environment = {
  production: false,
  ...base,
  MONGO_DB: process.env.MONGO_DB || "mongodb://localhost:27017/nowDB",
  // LOG_SOCKET: ["customer", "shipper", "merchant", "order"],
  LOG_SOCKET: [""],
};
