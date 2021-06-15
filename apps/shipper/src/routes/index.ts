import express from 'express';
const indexRouter = express.Router();

/* GET home page. */
indexRouter.get('/', function (req, res, next) {
  res.send('<h1>RESTful API for the final-year project </h1>');
});

export default indexRouter;
