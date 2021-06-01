import express from "express";
const generalRouter = express.Router();
import {
  getGeneralStatistics /*getNotification*/,
} from "../controllers/general";

generalRouter.get("/", getGeneralStatistics);
//generalRouter.get("/notification", getNotification);

export default generalRouter;
