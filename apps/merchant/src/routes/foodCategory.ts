import { FoodCategory } from "@vohoaian/datn-models";
import { body, param } from "express-validator";
import {
  createFoodCategory,
  getFoodCategories,
  updateFoodCategory,
} from "../controllers/foodCategory";
import foodRouter from "./food";
import express from "express";
import { validateInput } from "../middlewares/services";

const router = express.Router();

router.get("/", getFoodCategories);

router.post(
  "/",
  body("name").notEmpty().isString(),
  body("order").optional().isInt({ min: 0 }).toInt(),
  validateInput,
  createFoodCategory
);

router.put(
  "/:id",
  param("id").isMongoId(),
  body("name").optional().isString(),
  body("order").optional().isInt({ min: 0 }).toInt(),
  validateInput,
  updateFoodCategory
);

router.use(
  "/:foodcategory/foods",
  param("foodcategory").custom((value, { req }) => {
    return FoodCategory.findById(value)
      .exec()
      .then((foodcategory) => {
        if (!foodcategory) return Promise.reject("Khong tim thay foodcategory");
        req.data = { foodcategory };
      });
  }),
  validateInput,
  foodRouter
);

export default router;
