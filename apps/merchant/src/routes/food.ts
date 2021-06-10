import express from "express";
import { body, param } from "express-validator";
import {
  createFood,
  createItem,
  createOption,
  deleteFood,
  deleteItem,
  deleteOption,
  getFood,
  getFoods,
  updateFood,
  updateItem,
  updateOption,
} from "../controllers/food";
import { validateInput } from "../middlewares/services";
import multer from "multer";
import { nomalizeResponse } from "../utils/normalize";
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.get("/", getFoods);

router.get("/:id", param("id").isMongoId(), validateInput, getFood);

router.delete("/:id", param("id").isMongoId(), validateInput, deleteFood);

router.post(
  "/",
  upload.single("image"),
  (req, res, next) => {
    if (!req.file) return res.send(nomalizeResponse(null, 1));
    const body = req.body.data;
    try {
      req.body = JSON.parse(body);
    } catch (e) {
      res.send(nomalizeResponse(null, 1));
    }
    next();
  },
  body("name").isString(),
  // body("avatar").isMongoId(),
  body("price").isInt({ min: 0 }).toInt(),
  body("status").default(0).isInt({ min: -1 }).toInt(),
  body("options").optional().isArray(),
  validateInput,
  createFood
);

router.put(
  "/:id",
  param("id").isMongoId(),
  body("name").optional().isString(),
  body("price").optional().isInt({ min: 0 }).toInt(),
  body("status").optional().isInt({ min: -1 }).toInt(),
  body("order").optional().isInt({ min: 0 }).toInt(),
  validateInput,
  updateFood
);

router.post(
  "/:id/options",
  param("id").isMongoId(),
  body("name").isString(),
  body("ismandatory").default(false).isBoolean().toBoolean(),
  body("maxselect").default(1).isInt({ min: 1 }).toInt(),
  body("items").optional().isArray(),
  validateInput,
  createOption
);

router.put(
  "/:id/options/:opt",
  param("id").isMongoId(),
  param("opt").isInt({ min: 1 }),
  body("name").optional().isString(),
  body("ismandatory").optional().isBoolean().toBoolean(),
  body("maxselect").optional().isInt({ min: 1 }).toInt(),
  validateInput,
  updateOption
);

router.delete(
  "/:id/options/:opt",
  param("id").isMongoId(),
  param("opt").isInt({ min: 1 }),
  validateInput,
  deleteOption
);

router.post(
  "/:id/options/:opt/items",
  param("id").isMongoId(),
  param("opt").isInt({ min: 1 }),
  body("name").isString(),
  body("price").isInt({ min: 0 }).toInt(),
  body("isdefault").default(false).isBoolean().toBoolean(),
  body("maxquantity").default(1).isInt({ min: 1 }).toInt(),
  validateInput,
  createItem
);

router.put(
  "/:id/options/:opt/items/:item",
  param("id").isMongoId(),
  param("opt").isInt({ min: 1 }),
  param("item").isInt({ min: 1 }),
  body("name").optional().isString(),
  body("price").optional().isInt({ min: 0 }).toInt(),
  body("isdefault").optional().isBoolean().toBoolean(),
  body("maxquantity").optional().isInt({ min: 1 }).toInt(),
  validateInput,
  updateItem
);

router.delete(
  "/:id/options/:opt/items/:item",
  param("id").isMongoId(),
  param("opt").isInt({ min: 1 }),
  param("item").isInt({ min: 1 }),
  validateInput,
  deleteItem
);

export default router;
