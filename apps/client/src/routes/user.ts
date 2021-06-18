import { User } from "@vohoaian/datn-models";
import express from "express";
import { body, param } from "express-validator";
import { getUser, updateUser, updateUserAvatar } from "../controllers/user";
import {
  validateInput,
  jwtAuthentication,
  validatePrivateResource,
} from "../middlewares/services";
import deliveryAddressRouter from "./deliveryAddress";
import multer from "multer";
import { nomalizeResponse } from "../utils/normalize";
const upload = multer({ dest: "uploads/" });

const authRouter = express.Router();

authRouter.get(
  "/:uid",
  param("uid").notEmpty().isMongoId(),
  validateInput,
  jwtAuthentication,
  validatePrivateResource(),
  getUser
);

authRouter.put(
  "/:uid",
  param("uid").notEmpty().isMongoId(),
  body("fullname").optional().isString(),
  body("email").optional().isEmail(),
  body("gender").optional().isInt({ min: 0 }),
  validateInput,
  jwtAuthentication,
  validatePrivateResource(),
  updateUser
);

authRouter.put(
  "/:uid/avatar",
  param("uid").notEmpty().isMongoId(),
  validateInput,
  jwtAuthentication,
  validatePrivateResource(),
  upload.single("image"),
  (req, res, next) => {
    if (!req.file) return res.send(nomalizeResponse(null, 1));
    next();
  },
  updateUserAvatar
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
  validateInput,
  deliveryAddressRouter
);

export default authRouter;
