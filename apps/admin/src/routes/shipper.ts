import express from "express";
const shipperRouter = express.Router();
import { validateInput } from "../middlewares/services";
import { query } from "express-validator";
import { getShipperManagement } from "../controllers/shipper";

shipperRouter.get(
  "/",
  query("email").default("").isString(),
  query("page").default(1).isInt().toInt(),
  query("phone").default("").isString(),
  validateInput,
  getShipperManagement
);

export default shipperRouter;
