const express = require('express');
const authRouter = express.Router();
const {googleAuthentication} = require("../middlewares/services");
const authController = require("../controllers/auth.C");

authRouter.get('/google', googleAuthentication);

/* GET redirect link to get infomation from google . */
authRouter.get('/google/redirect', authController.loginwithGoogleAccount);

module.exports = authRouter;
