import express from "express";
const generalRouter = express.Router();
import { getGeneralStatistics } from "../controllers/general";

generalRouter.get("/", getGeneralStatistics);

export default generalRouter;
