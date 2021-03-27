const express = require('express');
const authRouter = express.Router();
const authController = require('../controllers/auth.C');
const { body } = require('express-validator');
const { jwtAuthentication } = require('../middlewares/services');
authRouter.post(
  '/google',
  body('id').notEmpty().isString(),
  body('accessToken').notEmpty().isString(),
  authController.loginWithGoogleAccount
);

authRouter.post(
  '/vertify-phone',
  body('userID')
    .notEmpty()
    .isString()
    .matches(/^[0-9]*$/gm),
  body('phone')
    .notEmpty()
    .isString()
    .matches(/^[0-9]*$/gm),
  authController.vertifyPhoneNumber
);

authRouter.get('/user-info', jwtAuthentication(), authController.getUserInfo);

authRouter.put(
  '/user-info',
  jwtAuthentication(),
  body('fullname').optional().isString(),
  body('gender').optional().isInt(),
  body('dob')
    .optional()
    .matches(
      /^([0][1-9]|[1][0-2])[/]([0][1-9]|[1|2][0-9]|[3][0|1])[/][0-9]{4}$/m
    )
    .customSanitizer((value) => moment(value, '"DD/MM/YYYY"').toDate()),
  body('address').optional().isString(),
  body('district').optional().isString(),
  body('city').optional().isString(),
  authController.updateUserInfo
);

module.exports = authRouter;
