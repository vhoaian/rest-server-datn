import express from "express";
import { body } from "express-validator";
const restaurantRouter = express.Router();
import { validateInput } from "../middlewares/services";
import moment from "moment";
import {
  getRestaurantInfo,
  deleteRestaurant,
  updateRestaurantInfo,
  updateRestaurantAddress,
  payReceipt,
} from "../controllers/restaurant";

restaurantRouter.get("/", getRestaurantInfo);
restaurantRouter.delete("/", deleteRestaurant);
restaurantRouter.put(
  "/info",
  body("name").notEmpty().isString(),
  body("openAt")
    .notEmpty()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .customSanitizer((value) => moment(value, "HH:mm").toDate()),
  body("closeAt")
    .notEmpty()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .customSanitizer((value) => moment(value, "HH:mm").toDate()),
  body("anouncement").notEmpty().isString(),
  validateInput,
  updateRestaurantInfo
);

restaurantRouter.put(
  "/address",
  body("city").notEmpty().isString(),
  body("district").notEmpty().isString(),
  body("ward").notEmpty().isString(),
  body("address").notEmpty().isString(),
  updateRestaurantAddress
);

restaurantRouter.post(
  "/pay-receipt",
  body("id").notEmpty().isMongoId(),
  validateInput,
  payReceipt
);

export default restaurantRouter;
