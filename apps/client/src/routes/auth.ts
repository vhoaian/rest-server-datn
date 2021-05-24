import express from 'express';
import { body } from 'express-validator';
import {
  loginWithGoogleAccount,
  requestOTPForRegistration,
  requestOTPForLogin,
  verifyOTPForRegistration,
  verifyOTPForLogin,
  requestOTPForPhoneRegistration,
  verifyOTPForPhoneRegistration,
} from '../controllers/auth';
import { validateInput } from '../middlewares/services';
const authRouter = express.Router();

// Đăng nhập gg bằng `idToken`
authRouter.post(
  '/google',
  body('idToken').notEmpty().isString(),
  validateInput,
  loginWithGoogleAccount
);

// Lấy otp để đăng ký bằng gg
authRouter.post(
  '/google/otp/call',
  body('user').isMongoId(),
  body('phone').isNumeric().isLength({ min: 10, max: 10 }),
  validateInput,
  requestOTPForRegistration
);

// Nhập otp để xác nhận đăng ký bằng gg
authRouter.post(
  '/google/otp/verify',
  body('user').notEmpty().isMongoId(),
  body('otp').isNumeric().isLength({ min: 6, max: 6 }),
  validateInput,
  verifyOTPForRegistration
);

// Lấy otp để đăng nhập bằng sdt
authRouter.post(
  '/phone/otp/call',
  body('phone').isNumeric().isLength({ min: 10, max: 10 }),
  validateInput,
  requestOTPForLogin
);

// Lấy otp để đăng ký bằng sdt
authRouter.post(
  '/phone/register/otp/call',
  body('phone').isNumeric().isLength({ min: 10, max: 10 }),
  validateInput,
  requestOTPForPhoneRegistration
);

// Nhập otp để đăng ký bằng sdt
authRouter.post(
  '/phone/register/otp/verify',
  body('phone').isNumeric().isLength({ min: 10, max: 10 }),
  validateInput,
  verifyOTPForPhoneRegistration
);

// Nhập otp để xác nhận đăng nhập bằng sdt
authRouter.post(
  '/phone/otp/verify',
  body('otp').isNumeric().isLength({ min: 6, max: 6 }),
  body('phone').isNumeric().isLength({ min: 10, max: 10 }),
  validateInput,
  verifyOTPForLogin
);

export default authRouter;
