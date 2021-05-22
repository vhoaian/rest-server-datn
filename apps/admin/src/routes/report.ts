import express from "express";
import { validateInput } from "../middlewares/services";
const reportRouter = express.Router();
import { query } from "express-validator";
import { getReportList } from "../controllers/report";

reportRouter.get(
  "/",
  query("page").default(1).isInt().toInt(),
  validateInput,
  getReportList
);

export default reportRouter;
