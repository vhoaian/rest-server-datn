import express from "express";
import { body, param, query } from "express-validator";
import { validateInput, jwtAuthentication } from "../middlewares/services";
import { getNotifications } from "../controllers/notification";

const router = express.Router();

router.get(
  "/",
  query("page").default(1).isInt().toInt(),
  query("perpage").default(20).isInt({ max: 50 }).toInt(),
  validateInput,
  jwtAuthentication,
  getNotifications
);

export default router;
