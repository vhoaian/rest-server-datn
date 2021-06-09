import express from "express";
import { query } from "express-validator";
const generalRouter = express.Router();
import { getGeneralStatistics } from "../controllers/general";
import { validateInput } from "../middlewares/services";

generalRouter.get(
  "/",
  query("filter").default("week").isString(),
  validateInput,
  getGeneralStatistics
);
//generalRouter.get("/notification", getNotification);

export default generalRouter;
