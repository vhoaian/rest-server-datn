import express from "express";
import { query, body } from "express-validator";
const userRouter = express.Router();
import { validateInput } from "../middlewares/services";
import { getUserManagementInfo } from "../controllers/user";

userRouter.get(
  "/",
  query("email").default("").isString(),
  query("page").default(1).isInt().toInt(),
  query("phone").default("").isString(),
  validateInput,
  getUserManagementInfo
);

export default userRouter;
