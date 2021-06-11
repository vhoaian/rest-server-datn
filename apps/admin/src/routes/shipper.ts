import express from "express";
const shipperRouter = express.Router();
import { validateInput } from "../middlewares/services";
import { body, query } from "express-validator";
import {
  getShipperManagement,
  createShipper,
  payReceipt,
} from "../controllers/shipper";

shipperRouter.get(
  "/",
  query("email").default("").isString(),
  query("page").default(1).isInt().toInt(),
  query("phone").default("").isString(),
  validateInput,
  getShipperManagement
);

shipperRouter.put(
  "/",
  body("email").notEmpty().isString(),
  body("phone").notEmpty().isMobilePhone("vi-VN"),
  body("fullName").notEmpty().isString(),
  body("gender").isNumeric().notEmpty(),
  validateInput,
  createShipper
);

shipperRouter.post(
  "/pay-receipt",
  body("id").notEmpty().isMongoId(),
  validateInput,
  payReceipt
);

export default shipperRouter;
