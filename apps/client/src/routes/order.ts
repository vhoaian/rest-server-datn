import express from "express";
import { body, param, query } from "express-validator";
import {
  validateInput,
  jwtAuthentication,
  validatePrivateResource,
} from "../middlewares/services";
import {
  addOrder,
  getOrder,
  getOrders,
  getShippingFee,
} from "../controllers/order";
import {
  addRestaurantReview,
  addRestaurantReviewNoImages,
  addShipperReview,
  addShipperReviewNoImages,
  getRestaurantReviewsv2,
  getShipperReviews,
} from "../controllers/restaurantreview";
import multer from "multer";
import { nomalizeResponse } from "../utils/normalize";
const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Đơn hàng của tôi
router.get(
  "/",
  query("status").optional().isInt().toArray(),
  query("page").default(1).isInt().toInt(),
  query("perpage").default(10).isInt({ max: 50 }).toInt(),
  validateInput,
  jwtAuthentication,
  getOrders
);

// Tính phí ship
router.get(
  "/shippingfee",
  query("restaurant").isMongoId(),
  query("deliveryaddress").optional().isMongoId(),
  query("destination").optional().isString(),
  validateInput,
  getShippingFee
);

// Chi tiet don hang
router.get(
  "/:id",
  param("id").isMongoId(),
  validateInput,
  jwtAuthentication,
  getOrder
);

// Đặt hàng
router.post(
  "/",
  body("foods").isArray().toArray(),
  body("subtotal").isInt().toInt(),
  body("method").isInt().toInt(),
  body("shippingfee").isInt().toInt(),
  body("deliveryaddress").optional().isMongoId(),
  body("longitude").optional().isFloat().toFloat(),
  body("latitude").optional().isFloat().toFloat(),
  body("address").optional().isString(),
  body("note").optional().isString(),
  body("phone").optional().isNumeric().isLength({ min: 10, max: 10 }),
  // body('promocodes').isArray(),
  validateInput,
  jwtAuthentication,
  addOrder
);

router.post(
  "/:id/restaurantreviews/raw",
  param("id").isMongoId(),
  body("content").isString(),
  body("point").isInt({ min: 1, max: 5 }),
  validateInput,
  jwtAuthentication,
  addRestaurantReviewNoImages
);

router.post(
  "/:id/restaurantreviews",
  param("id").isMongoId(),
  upload.array("images"),
  body("content").isString(),
  body("point").isInt({ min: 1, max: 5 }),
  validateInput,
  jwtAuthentication,
  addRestaurantReview
);

router.post(
  "/:id/shipperreviews/raw",
  param("id").isMongoId(),
  body("content").isString(),
  body("point").isInt({ min: 1, max: 5 }),
  validateInput,
  jwtAuthentication,
  addShipperReviewNoImages
);

router.post(
  "/:id/shipperreviews",
  param("id").isMongoId(),
  upload.array("images"),
  body("content").isString(),
  body("point").isInt({ min: 1, max: 5 }),
  validateInput,
  jwtAuthentication,
  addShipperReview
);

router.get(
  "/:id/restaurantreviews",
  param("id").isMongoId(),
  validateInput,
  jwtAuthentication,
  getRestaurantReviewsv2
);

router.get(
  "/:id/shipperreviews",
  param("id").isMongoId(),
  validateInput,
  jwtAuthentication,
  getShipperReviews
);

export default router;
