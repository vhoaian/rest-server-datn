const express = require('express');
const customerRouter = express.Router();
//import router
const customerAuthRouter = require('./customerAuth.R');
const customerFoodRouter = require('./customerFood.R');
//import controller

customerRouter.use('/auth', customerAuthRouter);

customerRouter.use('/food', customerFoodRouter);

//customerRouter.use('/info');

module.exports = customerRouter;
