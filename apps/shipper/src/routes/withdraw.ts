import express from "express";
import { body, param, query } from "express-validator";
import { validateInput, jwtAuthentication } from "../middlewares/services";
import { addWithdraw, getWithdraws } from "../controllers/withdraw";

const router = express.Router();

router.get(
  "/",
  query("page").default(1).isInt().toInt(),
  query("perpage").default(10).isInt({ max: 50 }).toInt(),
  query("status").optional().isInt().toArray(),
  validateInput,
  jwtAuthentication,
  getWithdraws
);

router.post(
  "/",
  body("amount").isInt({ min: 1 }).toInt(),
  validateInput,
  jwtAuthentication,
  addWithdraw
);

export default router;
