import express from "express";
import { body, param, query } from "express-validator";
import { validateInput, jwtAuthentication } from "../middlewares/services";
import { getOrders, getOrder } from "../controllers/order";

const router = express.Router();

// Lấy danh sách đơn hàng
router.get(
  "/",
  query("status").optional().isInt().toArray(),
  query("page").default(1).isInt().toInt(),
  query("perpage").default(10).isInt({ max: 50 }).toInt(),
  validateInput,
  jwtAuthentication,
  getOrders
);

router.get(
  "/:id",
  param("id").isMongoId(),
  validateInput,
  jwtAuthentication,
  getOrder
);

export default router;
