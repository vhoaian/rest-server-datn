const Constants = require('../config');
const AuthService = require('../services/CustomerAuth.S');
const { nomalizeResponse } = require('../utils');
const { validationResult } = require('express-validator');

const loginWithGoogleAccount = async (req, res) => {
  //res.send("go t ogoole");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { id, accessToken } = req.body;
  //get and save infor form google
  const { success, message, data } = await AuthService.loginWithGoogle(
    id,
    accessToken
  );
  res.send(nomalizeResponse(success, message, data));
};

const vertifyPhoneNumber = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userID, phone } = req.body;

  const { success, message, data } = await AuthService.registerNewUser(
    null,
    userID,
    phone
  );
  console.log({ success, message, data });
  res.send(nomalizeResponse(success, message, data));
};

const getUserInfo = async (req, res) => {
  const { id } = req.user;
  const { success, message, data } = await AuthService.getUserInfo(id);

  res.send(nomalizeResponse(success, message, data));
};

module.exports = {
  loginWithGoogleAccount,
  vertifyPhoneNumber,
  getUserInfo,
};
