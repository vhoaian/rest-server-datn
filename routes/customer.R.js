const express = require('express');
const customerRouter = express.Router();
//import router
const customerAuthRouter = require("./customerAuth.R");

//import controller

customerRouter.use("/auth", customerAuthRouter);


module.exports = customerRouter;
