import { FoodCategory } from '@vohoaian/datn-models';
import { body, param } from 'express-validator';
import { getFoodCategories } from '../controllers/foodCategory';
import foodRouter from './food';
import express from 'express';
import { validateInput } from '../middlewares/services';

const router = express.Router();

// TODO: type
// router.post(
//   '/',
//   body('name').notEmpty().isString(),
//   body('status').optional().isInt(),
//   createFoodCategory
// );

router.get('/', getFoodCategories);

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
  validateInput,
  foodRouter
);

export default router;
