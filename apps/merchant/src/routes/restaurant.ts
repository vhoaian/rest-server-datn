import { Manager } from "@vohoaian/datn-models";
import express from "express";
import { body, param, query } from "express-validator";

import {
  getFoodsOfRestaurant,
  getRestaurant,
  getRestaurants,
  getStatistics,
  updateRestaurant,
} from "../controllers/restaurant";
import { jwtAuthentication, validateInput } from "../middlewares/services";
import foodCategoryRouter from "./foodCategory";
import orderRouter from "./order";
import notificationRouter from "./notification";
import withdrawRouter from "./withdraw";
import { getDateFromTimeString } from "../utils/time";

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

router.get(
  "/:restaurant/statistics",
  param("restaurant").isMongoId(),
  query("status").optional().isInt().toArray(),
  query("montha").optional().isInt({ min: 1, max: 12 }),
  query("daya").optional().isInt({ min: 1, max: 31 }),
  query("yeara").optional().isInt({ min: 2020 }),
  query("monthb").optional().isInt({ min: 1, max: 12 }),
  query("dayb").optional().isInt({ min: 1, max: 31 }),
  query("yearb").optional().isInt({ min: 2020 }),
  validateInput,
  getStatistics
);

router.put(
  "/:restaurant",
  param("restaurant").isMongoId(),
  body("status").optional().isInt({ min: -1 }).toInt(),
  body("openingAt").optional().customSanitizer(getDateFromTimeString),
  body("closingAt").optional().customSanitizer(getDateFromTimeString),
  validateInput,
  updateRestaurant
);

router.get("/:restaurant", getRestaurant);

router.use("/:restaurant/foodcategories", foodCategoryRouter);
router.use("/:restaurant/orders", orderRouter);
router.use("/:restaurant/notifications", notificationRouter);
router.use("/:restaurant/withdraws", withdrawRouter);

export default router;
