import express from "express";
import { query, body, param } from "express-validator";
const restaurantListRouter = express.Router();
import { Restaurant } from "@vohoaian/datn-models";
import {
  getRestaurantManagementInfo,
  createNewRestanrant,
} from "../controllers/restaurantList";
import { validateInput } from "../middlewares/services";
import moment from "moment";
import restaurantRouter from "./restaurant";
import { withFilter } from "../utils/objects";

restaurantListRouter.get(
  "/",
  query("search").default("").isString(),
  query("page").default(1).isInt().toInt(),
  query("city").default(0).isInt().toInt(),
  query("district").default(0).isInt().toInt(),
  validateInput,
  getRestaurantManagementInfo
);

restaurantListRouter.post(
  "/",
  body("name").notEmpty().isString(),
  body("contractID").notEmpty().isString(),
  body("openTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .customSanitizer((value) => moment(value, "HH:mm").toDate()),
  body("closeTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .customSanitizer((value) => moment(value, "HH:mm").toDate()),
  body("city").notEmpty().isString(),
  body("district").notEmpty().isString(),
  body("ward").notEmpty().isString(),
  body("address").notEmpty().isString(),
  validateInput,
  createNewRestanrant
);

restaurantListRouter.use(
  "/:restaurant",
  param("restaurant").custom((value, { req }) => {
    return Restaurant.findById(value)
      .exec()
      .then((restaurant) => {
        if (!restaurant) return Promise.reject("Khong tim thay restaurant");
        req.data = {
          restaurant: withFilter(
            "id Name Avatar Description Anouncement Address OpenHours Phone Geolocation Categories"
          )(restaurant.toObject({ virtuals: true })),
        };
      });
  }),
  validateInput,
  restaurantRouter
);

export default restaurantListRouter;
