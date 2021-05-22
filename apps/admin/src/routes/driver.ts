import express from "express";
const driverRouter = express.Router();
import { validateInput } from "../middlewares/services";
import { query } from "express-validator";
import { getDriverManagement } from "../controllers/driver";

driverRouter.get(
  "/",
  query("email").default("").isString(),
  query("page").default(1).isInt().toInt(),
  query("phone").default("").isString(),
  validateInput,
  getDriverManagement
);

export default driverRouter;
