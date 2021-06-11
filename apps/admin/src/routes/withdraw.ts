import express from "express";
import { jwtAuthentication, validateInput } from "../middlewares/services";
const withdrawRouter = express.Router();
import {
  cancelWithdraw,
  handleWithdraw,
  getAllRequestWithdraw,
} from "../controllers/withdraw";
import { body, query } from "express-validator";

withdrawRouter.use(jwtAuthentication);

withdrawRouter.get(
  "/",
  query("page").default(1).isInt().toInt(),
  validateInput,
  getAllRequestWithdraw
);

withdrawRouter.post(
  "/",
  body("id").notEmpty().isMongoId,
  validateInput,
  handleWithdraw
);

withdrawRouter.post(
  "/calcel",
  body("id").notEmpty().isMongoId,
  validateInput,
  cancelWithdraw
);

export default withdrawRouter;
