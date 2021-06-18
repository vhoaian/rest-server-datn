import express from "express";
import { query } from "express-validator";
import { validateInput, jwtAuthentication } from "../middlewares/services";
import { getShipperReviews } from "../controllers/shipperreview";

const router = express.Router();

router.get(
  "/",
  query("page").default(1).isInt().toInt(),
  query("perpage").default(10).isInt({ max: 50 }).toInt(),
  query("point").optional().isInt().toArray(),
  query("image").optional().isBoolean().toBoolean(),
  validateInput,
  jwtAuthentication,
  getShipperReviews
);

export default router;
