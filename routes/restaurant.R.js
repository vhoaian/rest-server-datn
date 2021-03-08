const { Restaurant } = require('@vohoaian/datn-models');
var express = require('express');
const { body, param } = require('express-validator');
const moment = require('moment');
const {
  createRestaurant,
  getRestaurants,
} = require('../controllers/restaurant.C');
var router = express.Router();

// TODO: location, status
router.post(
  '/',
  body('name').notEmpty().isString(),
  body('contractID').notEmpty().isString(),
  body('openAt')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .customSanitizer((value) => moment(value, 'HH:mm').toDate()),
  body('closeAt')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .customSanitizer((value) => moment(value, 'HH:mm').toDate()),
  body('address').notEmpty().isString(),
  body('type').optional().isInt(),
  body('description').optional().isString(),
  body('avatar').optional().isURL(),
  body('anouncement').optional().isString(),
  body('parkingFree').optional().isInt(),
  createRestaurant
);

router.get('/', getRestaurants);

const foodCategoryRouter = require('./foodCategory.R');
router.use(
  '/:restaurant/foodcategories',
  param('restaurant').custom((value, { req }) => {
    return Restaurant.findById(value)
      .exec()
      .then((restaurant) => {
        if (!restaurant) return Promise.reject('Khong tim thay restaurant');
        req.data = { restaurant };
      });
  }),
  foodCategoryRouter
);

module.exports = router;
