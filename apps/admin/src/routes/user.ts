import express from "express";
import { query, param, body } from "express-validator";
const userRouter = express.Router();
import { validateInput } from "../middlewares/services";
import { getUserManagementInfo, blockUserById } from "../controllers/user";
import { User } from "@vohoaian/datn-models";

userRouter.get(
  "/",
  query("email").default("").isString(),
  query("page").default(1).isInt().toInt(),
  query("phone").default("").isString(),
  validateInput,
  getUserManagementInfo
);

userRouter.put(
  "/:id/block",
  param("id")
    .notEmpty()
    .isMongoId()
    .custom((value, { req }) => {
      return User.findById(value)
        .exec()
        .then((user) => {
          if (!user) return Promise.reject("Khong tim thay nguoi dung");
          req.data = { user };
        });
    }),
  body("id").notEmpty().isMongoId(),
  validateInput,
  blockUserById
);

export default userRouter;
