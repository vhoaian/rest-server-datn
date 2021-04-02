const express = require('express');
const customerRouter = express.Router();
//import router
const customerAuthRouter = require('./customerAuth.R');
const customerFoodRouter = require('./customerFood.R');
const customerCityRouter = require('./customerCity.R');
//import controller

customerRouter.use('/auth', customerAuthRouter);

customerRouter.use('/cities', customerCityRouter);

//customerRouter.use('/info');

module.exports = customerRouter;
