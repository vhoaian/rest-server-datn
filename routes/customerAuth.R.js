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

module.exports = authRouter;
