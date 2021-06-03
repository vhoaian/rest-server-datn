import { Manager, Restaurant } from "@vohoaian/datn-models";
import express from "express";
import { body, param, query } from "express-validator";

import {
  getFoodsOfRestaurant,
  getRestaurant,
  getRestaurants,
} from "../controllers/restaurant";
import { jwtAuthentication, validateInput } from "../middlewares/services";
import foodCategoryRouter from "./foodCategory";

const router = express.Router();

router.get("/", jwtAuthentication, getRestaurants);

router.use(
  "/:restaurant",
  jwtAuthentication,
  param("restaurant").custom((value, { req }) => {
    return Manager.findById(req.user.id)
      .exec()
      .then((manager) => {
        if (!manager) return Promise.reject("Khong tim thay manager");
        if (!manager.Roles.find((r) => r.Restaurant.equals(value)))
          return Promise.reject("Khong tim thay nha hang");
        req.data = { manager, restaurant: value };
      });
  }),
  validateInput
);

router.get(
  "/:restaurant/foods",
  param("restaurant").isMongoId(),
  validateInput,
  getFoodsOfRestaurant
);

router.get("/:restaurant", getRestaurant);

router.use("/:restaurant/foodcategories", foodCategoryRouter);

export default router;
