import express from "express";
import { body, check, param } from "express-validator";
import {
  createFood,
  createOption,
  getFood,
  getFoods,
} from "../controllers/food";

const router = express.Router();

router.get("/", getFoods);

router.get("/:id", param("id").isMongoId(), getFood);

router.post(
  "/",
  body("name").isString(),
  body("avatar").isMongoId(),
  body("price").isInt({ min: 0 }).toInt(),
  body("status").default(0).isInt({ min: -1 }).toInt(),
  body("options").optional().isArray(),
  createFood
);

router.post(
  "/:id/options",
  body("name").isString(),
  body("ismandatory").default(false).isBoolean().toBoolean(),
  body("maxselect").default(1).isInt({ min: 1 }).toInt(),
  body("items").optional().isArray(),
  createOption
);

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
