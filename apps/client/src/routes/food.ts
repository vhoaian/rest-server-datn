import { Food, FoodCategory } from '@vohoaian/datn-models';
import express from 'express';
import { body, check, param } from 'express-validator';
import { getFoods } from '../controllers/food';

const router = express.Router();

// TODO: status
// router.post(
//   '/',
//   body('name').isString(),
//   body('originalPrice').isInt({ min: 0 }),
//   body('images').optional().isArray(),
//   check('images.*').isURL(),
//   body('type').optional().isInt(),
//   createFood
// );

router.get('/', getFoods);

// router.delete(
//   '/:food',
//   param('food').custom((value, { req }) => {
//     return Food.findById(value)
//       .exec()
//       .then((food) => {
//         if (!food) return Promise.reject('Khong tim thay food');
//         req.data = { ...req.data, food };
//       });
//   }),
//   deleteFood
// );

// router.put(
//   '/:food',
//   body('name').optional().isString(),
//   body('originalPrice').optional().isInt({ min: 0 }),
//   body('foodCategory')
//     .optional()
//     .custom((value, { req }) => {
//       return FoodCategory.findById(value)
//         .exec()
//         .then((destfoodcategory) => {
//           if (!destfoodcategory)
//             return Promise.reject('Khong tim thay destfoodcategory');
//           req.data = { ...req.data, destfoodcategory };
//         });
//     }),
//   body('images').optional().isArray(),
//   check('images.*').isURL(),
//   body('type').optional().isInt(),
//   body('status').optional().isInt(),
//   param('food').custom((value, { req }) => {
//     return Food.findById(value)
//       .exec()
//       .then((food) => {
//         if (!food) return Promise.reject('Khong tim thay food');
//         if (!food.FoodCategory.equals(req.data.foodcategory.id))
//           return Promise.reject('Khong tim thay food');
//         req.data = { ...req.data, food };
//       });
//   }),
//   updateFood
// );

export default router;
