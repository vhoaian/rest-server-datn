const { FoodCategory } = require('@vohoaian/datn-models');
var express = require('express');
const { body, param } = require('express-validator');
const {
  createFoodCategory,
  getFoodCategories,
} = require('../controllers/foodCategory.C');
var router = express.Router();

// TODO: type
router.post(
  '/',
  body('name').notEmpty().isString(),
  body('status').optional().isInt(),
  createFoodCategory
);

router.get('/', getFoodCategories);

const foodRouter = require('./food.R');
router.use(
  '/:foodcategory/foods',
  param('foodcategory').custom((value, { req }) => {
    return FoodCategory.findById(value)
      .exec()
      .then((foodcategory) => {
        if (!foodcategory) return Promise.reject('Khong tim thay foodcategory');
        req.data = { foodcategory };
      });
  }),
  foodRouter
);
module.exports = router;
