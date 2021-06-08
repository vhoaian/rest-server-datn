import express from "express";
import { query } from "express-validator";
import { validateInput } from "../middlewares/services";
import { getCities } from "../controllers/city";
const cityRouter = express.Router();

cityRouter.get(
  "/",
  query("city").optional().isString(),
  validateInput,
  getCities
);

export default cityRouter;
