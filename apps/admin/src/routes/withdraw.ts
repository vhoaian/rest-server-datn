import express from "express";
import { validateInput } from "../middlewares/services";
const withdrawRouter = express.Router();
import {
  cancelWithdraw,
  handleWithdraw,
  getAllRequestWithdraw,
} from "../controllers/withdraw";
import { body, query } from "express-validator";

withdrawRouter.get(
  "/",
  query("page").default(1).isInt().toInt(),
  query("phone").default("").isString(),
  validateInput,
  getAllRequestWithdraw
);

withdrawRouter.post(
  "/",
  body("id").notEmpty().isMongoId(),
  validateInput,
  handleWithdraw
);

withdrawRouter.post(
  "/cancel",
  body("id").notEmpty().isMongoId(),
  validateInput,
  cancelWithdraw
);

export default withdrawRouter;
