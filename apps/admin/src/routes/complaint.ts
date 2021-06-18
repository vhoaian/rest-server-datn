import express from "express";
import { body, query, param } from "express-validator";
import complaintController from "../controllers/complaint";
import { validateInput } from "../middlewares/services";
const router = express.Router();
import { jwtAuthentication } from "../middlewares/services";

router.post(
  "/",
  body("reason").notEmpty().withMessage("Reason invalid."),
  body("email").notEmpty().isEmail().withMessage("Email invalid."),
  body("images").notEmpty().withMessage("Images invalid."),
  body("phoneNumber")
    .notEmpty()
    .matches(/\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/)
    .withMessage("Phone number invalid."),
  body("fullName").notEmpty().withMessage("Fullname invalid."),
  body("orderID").notEmpty().isMongoId().withMessage("OrderID invalid."),
  validateInput,
  complaintController.hookUpdateComplaint
);

router.get(
  "/",
  query("page").default(1).isInt().toInt(),
  validateInput,
  jwtAuthentication,
  complaintController.getComplaintList
);

router.get(
  "/:id",
  param("id").notEmpty().isMongoId(),
  validateInput,
  jwtAuthentication,
  complaintController.getDetailCompliant
);

router.put("/:id", jwtAuthentication, complaintController.solveComplaint);

export default router;
