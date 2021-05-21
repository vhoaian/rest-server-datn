import { Restaurant } from '@vohoaian/datn-models';
import express from 'express';
import { body, param, query } from 'express-validator';

import { getRestaurantInfo, getRestaurants } from '../controllers/restaurant';
import { validateInput } from '../middlewares/services';
import { withFilter } from '../utils/objects';
import foodCategoryRouter from './foodCategory';

const router = express.Router();

// TODO: location, status
// router.post(
//   '/',
//   body('name').notEmpty().isString(),
//   body('contractID').notEmpty().isString(),
//   body('openAt')
//     .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
//     .customSanitizer((value) => moment(value, 'HH:mm').toDate()),
//   body('closeAt')
//     .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
//     .customSanitizer((value) => moment(value, 'HH:mm').toDate()),
//   body('address').notEmpty().isString(),
//   body('type').optional().isInt(),
//   body('description').optional().isString(),
//   body('avatar').optional().isURL(),
//   body('anouncement').optional().isString(),
//   body('parkingFee').optional().isInt(),
//   validateInput,
//   createRestaurant
// );

router.get(
  '/',
  query('page').default(1).isInt().toInt(),
  query('latitude').optional().isFloat().toFloat(),
  query('longitude').optional().isFloat().toFloat(),
  query('keyword').default('').isString(),
  query('perpage').default(10).isInt().toInt(),
  query('sort').default('distance').isString(),
  validateInput,
  getRestaurants
);

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

// router.get(
//   '/:restaurant/foods',
//   param('restaurant').isMongoId(),
//   getFoodsOfRestaurant
// );

router.get(
  '/:restaurant',
  param('restaurant').custom((value, { req }) => {
    return Restaurant.findById(value)
      .exec()
      .then((restaurant) => {
        if (!restaurant) return Promise.reject('Khong tim thay restaurant');
        req.data = {
          restaurant: withFilter(
            'id Name Avatar Description Anouncement FullAddress OpenHours Phone'
          )(restaurant.toObject({ virtuals: true })),
        };
      });
  }),
  validateInput,
  getRestaurantInfo
);

export default router;
