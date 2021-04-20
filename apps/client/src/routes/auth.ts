import express from 'express';
import { body } from 'express-validator';
import {
  loginWithGoogleAccount,
  requestOTPForThirdPartyRegistration,
  requestOTPForExistUser,
} from '../controllers/auth';
import { jwtAuthentication, validateInput } from '../middlewares/services';
const authRouter = express.Router();

authRouter.post(
  '/google',
  body('idToken').notEmpty().isString(),
  validateInput,
  loginWithGoogleAccount
);

authRouter.post(
  '/google/otp/call',
  body('user').notEmpty().isMongoId(),
  body('phone')
    .notEmpty()
    .isString()
    .matches(/^[0-9]*$/g),
  validateInput,
  requestOTPForThirdPartyRegistration
);

authRouter.post(
  '/google/otp/verify',
  body('user').notEmpty().isMongoId(),
  body('otp')
    .notEmpty()
    .isString()
    .isLength({ min: 6, max: 6 })
    .matches(/^[0-9]*$/g),
  validateInput,
  loginWithGoogleAccount
);

authRouter.post(
  '/otp/call',

  jwtAuthentication,
  validateInput,
  requestOTPForExistUser
);

authRouter.post(
  '/otp/verify',

  body('otp')
    .notEmpty()
    .isString()
    .isLength({ min: 6, max: 6 })
    .matches(/^[0-9]*$/g),
  jwtAuthentication,
  validateInput,
  requestOTPForExistUser
);

authRouter.post(
  '/phone/otp/call',
  body('phone')
    .notEmpty()
    .isString()
    .matches(/^[0-9]*$/g),
  validateInput,
  requestOTPForExistUser
);

authRouter.post(
  '/phone/otp/verify',
  body('phone')
    .notEmpty()
    .isString()
    .matches(/^[0-9]*$/g),
  body('otp')
    .notEmpty()
    .isString()
    .isLength({ min: 6, max: 6 })
    .matches(/^[0-9]*$/g),
  validateInput,
  requestOTPForExistUser
);

// authRouter.get('/user-info', jwtAuthentication(), authController.getUserInfo);

// authRouter.put(
//   '/user-info',
//   body('fullname').optional().isString(),
//   body('gender').optional().isInt(),
//   body('dob')
//     .optional()
//     .matches(
//       /^([0][1-9]|[1][0-2])[/]([0][1-9]|[1|2][0-9]|[3][0|1])[/][0-9]{4}$/m
//     ),
//   body('address').optional().isString(),
//   body('district').optional().isString(),
//   body('city').optional().isString(),
//   jwtAuthentication(),
//   authController.updateUserInfo
// );

export default authRouter;
