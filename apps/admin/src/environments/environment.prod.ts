import { environment as base } from "./base";

export const environment = {
  production: true,
  ...base,
  MONGO_DB: process.env.MONGO_DB || "mongodb://localhost:27017/nowDB",
};
