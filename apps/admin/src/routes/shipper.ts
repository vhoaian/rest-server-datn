import express from "express";
const shipperRouter = express.Router();
import { validateInput } from "../middlewares/services";
import { body, query, param } from "express-validator";
import {
  getShipperManagement,
  createShipper,
  payReceipt,
  blockShipperById,
  updateBoomOrderByID,
} from "../controllers/shipper";
import { Order, Shipper } from "@vohoaian/datn-models";

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

shipperRouter.put(
  "/:id/block",
  param("id")
    .notEmpty()
    .isMongoId()
    .custom((value, { req }) => {
      return Shipper.findById(value)
        .exec()
        .then((shipper) => {
          if (!shipper) return Promise.reject("Khong tim thay tai xe");
          req.data = { shipper };
        });
    }),
  body("id").notEmpty().isMongoId(),
  body("reason").optional().isString(),
  validateInput,
  blockShipperById
);

shipperRouter.post(
  "/:id/boom",
  param("id").notEmpty().isMongoId(),

  body("orderID")
    .notEmpty()
    .isMongoId()
    .custom((value, { req }) => {
      return Order.findById(value)
        .exec()
        .then((order) => {
          if (!order) return Promise.reject("Không tìm thấy đơn hàng");
          req.data = { order };
        });
    }),
  validateInput,
  updateBoomOrderByID
);
export default shipperRouter;
