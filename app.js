require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const { connect } = require('@vohoaian/datn-models');
const { MONGO_DB } = require('./config');

//using swagger document
//const swaggerDocument = require('./doc/apiDoc/swagger.json');
require('dotenv').config();

const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// connect to DB
//
process.env.ENVIRONMENT === 'DEVELOPMENT'
  ? connect('PRODUCTION')
  : connect('MYSELF', MONGO_DB);

//require midwares
app.use(passport.initialize());
require('./middlewares');
//require routes
const indexRouter = require('./routes/index.R');
const customerRouter = require('./routes/customer.R');
const restaurantRouter = require('./routes/restaurant.R');

app.use('/', indexRouter);

//restaurants router
app.use('/restaurants', restaurantRouter);

//customer router
app.use('/customer', customerRouter);

//route for api documentation
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('error');
});

module.exports = app;
