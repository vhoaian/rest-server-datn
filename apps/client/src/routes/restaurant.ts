import { Restaurant } from "@vohoaian/datn-models";
import express from "express";
import { body, param, query } from "express-validator";

import {
  getFoodsOfRestaurant,
  getRestaurantInfo,
  getRestaurants,
} from "../controllers/restaurant";
import { validateInput } from "../middlewares/services";
import { withFilter } from "../utils/objects";
import foodCategoryRouter from "./foodCategory";
import restaurantreviewRouter from "./restaurantreview";

const router = express.Router();

router.get(
  "/",
  query("page").default(1).isInt().toInt(),
  query("latitude").optional().isFloat().toFloat(),
  query("longitude").optional().isFloat().toFloat(),
  query("keyword").default("").isString(),
  query("perpage").default(10).isInt({ max: 50 }).toInt(),
  query("sort").default(0).isInt({ min: 0, max: 4 }).toInt(),
  query("city").optional().isInt().toInt(),
  query("districts").optional().isNumeric().toArray(),
  query("types").optional().isNumeric().toArray(),
  validateInput,
  getRestaurants
);

router.use(
  "/:restaurant/foodcategories",
  param("restaurant").custom((value, { req }) => {
    return Restaurant.findById(value)
      .exec()
      .then((restaurant) => {
        if (!restaurant || restaurant.Status == -2)
          return Promise.reject("Khong tim thay restaurant");
        req.data = { restaurant };
      });
  }),
  validateInput,
  foodCategoryRouter
);

router.use(
  "/:restaurant/reviews",
  param("restaurant").custom((value, { req }) => {
    return Restaurant.findById(value)
      .exec()
      .then((restaurant) => {
        if (!restaurant || restaurant.Status == -2)
          return Promise.reject("Khong tim thay restaurant");
        req.data = { restaurant };
      });
  }),
  validateInput,
  restaurantreviewRouter
);

router.get(
  "/:restaurant/foods",
  param("restaurant").isMongoId(),
  validateInput,
  getFoodsOfRestaurant
);

router.get(
  "/:restaurant",
  param("restaurant").custom((value, { req }) => {
    return Restaurant.findById(value)
      .exec()
      .then((restaurant) => {
        if (!restaurant) return Promise.reject("Khong tim thay restaurant");
        req.data = {
          restaurant: withFilter(
            "id Name Avatar Description Anouncement FullAddress OpenHours Phone Geolocation Categories"
          )(restaurant.toObject({ virtuals: true })),
        };
      });
  }),
  validateInput,
  getRestaurantInfo
);

export default router;
