const express = require('express');
const indexRouter = express.Router();
const indexController = require("../controllers/index.C");


/* GET home page. */
indexRouter.get('/', function(req, res, next) {
  res.send("<h1>RESTful API for the final-year project </h1>");
});

indexRouter.get('/top-rating', indexController.getTopRatingFood);

module.exports = indexRouter;
