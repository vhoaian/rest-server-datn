import express from "express";
import { body, param, query } from "express-validator";
import {
  getStatistics,
  getUser,
  updateUser,
  updateUserAvatar,
  updateUserSetting,
} from "../controllers/shipper";
import {
  validateInput,
  jwtAuthentication,
  validatePrivateResource,
} from "../middlewares/services";
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
  "/:uid/setting",
  param("uid").notEmpty().isMongoId(),
  body("maxorder").optional().isInt({ min: 0 }).toInt(),
  body("maxdistance").optional().isInt({ min: 0 }).toInt(),
  body("maxamount").optional().isInt({ min: 0 }).toInt(),
  body("minamount").optional().isInt({ min: 0 }).toInt(),
  validateInput,
  jwtAuthentication,
  validatePrivateResource(),
  updateUserSetting
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

authRouter.get(
  "/:uid/statistics",
  param("uid").notEmpty().isMongoId(),
  query("status").optional().isInt().toArray(),
  query("montha").optional().isInt({ min: 1, max: 12 }),
  query("daya").optional().isInt({ min: 1, max: 31 }),
  query("yeara").optional().isInt({ min: 2020 }),
  query("monthb").optional().isInt({ min: 1, max: 12 }),
  query("dayb").optional().isInt({ min: 1, max: 31 }),
  query("yearb").optional().isInt({ min: 2020 }),
  validateInput,
  jwtAuthentication,
  validatePrivateResource(),
  getStatistics
);

export default authRouter;
