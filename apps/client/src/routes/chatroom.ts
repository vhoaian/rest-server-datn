import express from "express";
import { body, param, query } from "express-validator";
import { validateInput, jwtAuthentication } from "../middlewares/services";
import { getChatMessages, getChatRooms } from "../controllers/chatroom";

const router = express.Router();

router.get(
  "/",
  query("page").default(1).isInt().toInt(),
  query("perpage").default(10).isInt({ max: 50 }).toInt(),
  validateInput,
  jwtAuthentication,
  getChatRooms
);

router.get(
  "/:id/messages",
  param("id").isMongoId(),
  query("page").default(1).isInt().toInt(),
  query("perpage").default(10).isInt({ max: 50 }).toInt(),
  validateInput,
  jwtAuthentication,
  getChatMessages
);

export default router;
