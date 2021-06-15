import express from "express";
import { body } from "express-validator";
import multer from "multer";
const restaurantRouter = express.Router();
import { validateInput } from "../middlewares/services";

const upload = multer({ dest: "uploads/" });

import {
  getRestaurantInfo,
  deleteRestaurant,
  updateRestaurantInfo,
  updateRestaurantAddress,
  payReceipt,
  addPermissionForRestaurant,
} from "../controllers/restaurant";

restaurantRouter.get("/", getRestaurantInfo);
restaurantRouter.delete("/", deleteRestaurant);

restaurantRouter.put(
  "/info",
  upload.single("avatar"),
  // body("name").notEmpty().isString(),
  // body("phone").notEmpty().isNumeric().isLength({ min: 10, max: 10 }),
  // body("openAt")
  //   .notEmpty()
  //   .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  //   .customSanitizer((value) => moment(value, "HH:mm").toDate()),
  // body("closeAt")
  //   .notEmpty()
  //   .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  //   .customSanitizer((value) => moment(value, "HH:mm").toDate()),
  // body("anouncement").notEmpty().isString(),
  validateInput,
  updateRestaurantInfo
);

restaurantRouter.put(
  "/address",
  body("city").notEmpty().isString(),
  body("district").notEmpty().isString(),
  body("ward").notEmpty().isString(),
  body("address").notEmpty().isString(),
  validateInput,
  updateRestaurantAddress
);

restaurantRouter.post(
  "/pay-receipt",
  body("id").notEmpty().isMongoId(),
  validateInput,
  payReceipt
);

restaurantRouter.put(
  "/permision",
  body("fullname").notEmpty().isString(),
  body("email").notEmpty().isEmail(),
  body("phone").notEmpty().isNumeric().isLength({ min: 10, max: 10 }),
  body("managerID").notEmpty().isMongoId(),
  validateInput,
  addPermissionForRestaurant
);

export default restaurantRouter;
