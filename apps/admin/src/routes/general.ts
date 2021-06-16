import express from "express";
import { body, query } from "express-validator";
const generalRouter = express.Router();
import {
  getGeneralStatistics,
  getSetting,
  updateSetting,
} from "../controllers/general";
import { validateInput } from "../middlewares/services";

generalRouter.get(
  "/",
  query("filter").default("week").isString(),
  validateInput,
  getGeneralStatistics
);

generalRouter.get("/setting", getSetting);
generalRouter.put(
  "/setting",
  body("id").notEmpty().isMongoId(),
  body("shipperPercent").notEmpty().isInt().toInt(),
  body("merchantPercent").notEmpty().isInt().toInt(),
  body("delayDay").notEmpty().isInt().toInt(),

  validateInput,
  updateSetting
);

export default generalRouter;
