import express from "express";
import { body, param, query } from "express-validator";
import { validateInput, jwtAuthentication } from "../middlewares/services";
import { getRestaurantReviews } from "../controllers/restaurantreview";

const router = express.Router();

router.get(
  "/",
  query("page").default(1).isInt().toInt(),
  query("perpage").default(10).isInt({ max: 50 }).toInt(),
  query("point").optional().isInt().toArray(),
  query("image").optional().isBoolean().toBoolean(),
  validateInput,
  jwtAuthentication,
  getRestaurantReviews
);

export default router;
