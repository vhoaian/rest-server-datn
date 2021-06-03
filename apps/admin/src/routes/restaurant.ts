import express from "express";
import { query, body, param } from "express-validator";
const restaurantRouter = express.Router();
import {
  deleteRestaurant,
  getRestaurantManagementInfo,
  createNewRestanrant,
} from "../controllers/restaurant";
import { validateInput } from "../middlewares/services";
import moment from "moment";

restaurantRouter.get(
  "/",
  query("search").default("").isString(),
  query("page").default(1).isInt().toInt(),
  query("city").default(0).isInt().toInt(),
  query("district").default(0).isInt().toInt(),
  validateInput,
  getRestaurantManagementInfo
);

restaurantRouter.post(
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

restaurantRouter.delete(
  "/:id",
  param("id").notEmpty().isMongoId(),
  validateInput,
  deleteRestaurant
);

export default restaurantRouter;
