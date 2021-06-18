import express from "express";
import { body } from "express-validator";
import {
  loginByEmail,
  requestOTPForLogin,
  verifyOTPForLogin,
} from "../controllers/auth";
import { validateInput } from "../middlewares/services";
const authRouter = express.Router();

// Lấy otp để đăng nhập bằng sdt
authRouter.post(
  "/phone/otp/call",
  body("phone").isNumeric().isLength({ min: 10, max: 10 }),
  validateInput,
  requestOTPForLogin
);

authRouter.post(
  "/email",
  body("email").isEmail(),
  body("password").isString(),
  validateInput,
  loginByEmail
);

// Nhập otp để xác nhận đăng nhập bằng sdt
authRouter.post(
  "/phone/otp/verify",
  body("otp").isNumeric().isLength({ min: 6, max: 6 }),
  body("phone").isNumeric().isLength({ min: 10, max: 10 }),
  validateInput,
  verifyOTPForLogin
);

export default authRouter;
