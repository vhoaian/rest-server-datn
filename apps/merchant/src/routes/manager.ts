import { User } from "@vohoaian/datn-models";
import express from "express";
import { body, param } from "express-validator";
import {
  validateInput,
  jwtAuthentication,
  validatePrivateResource,
} from "../middlewares/services";

const authRouter = express.Router();

// Lấy thông tin KH
authRouter.get(
  "/:uid",
  param("uid").notEmpty().isMongoId(),
  validateInput,
  jwtAuthentication,
  validatePrivateResource()
  // getUser
);

// Cập nhật tt KH
authRouter.put(
  "/:uid",
  param("uid").notEmpty().isMongoId(),
  validateInput,
  jwtAuthentication,
  validatePrivateResource()
  // updateUser
);

// Router địa chỉ (gán req.user._data)
authRouter.use(
  "/:uid/deliveryaddresses",
  param("uid").notEmpty().isMongoId(),
  validateInput,
  jwtAuthentication,
  validatePrivateResource(),
  param("uid").custom((value, { req }) => {
    return User.findById(value)
      .exec()
      .then((_user) => {
        if (!_user) return Promise.reject("Khong tim thay user");
        req.data = { _user };
      });
  }),
  validateInput
  // deliveryAddressRouter
);

export default authRouter;
