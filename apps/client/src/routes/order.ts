import express from 'express';
import { body, param, query } from 'express-validator';
import {
  validateInput,
  jwtAuthentication,
  validatePrivateResource,
} from '../middlewares/services';
import {
  addOrder,
  getOrder,
  getOrders,
  getShippingFee,
} from '../controllers/order';
const router = express.Router();

// Đơn hàng của tôi
router.get('/', jwtAuthentication, getOrders);

// Tính phí ship
router.get(
  '/shippingfee',
  query('longitude').isFloat().toFloat(),
  query('latitude').isFloat().toFloat(),
  query('restaurant').isMongoId(),
  query('deliveryaddress').optional().isMongoId(),
  validateInput,
  getShippingFee
);

router.get(
  '/:id',
  param('id').isMongoId(),
  validateInput,
  jwtAuthentication,
  getOrder
);

// Đặt hàng
router.post(
  '/',
  body('foods').isArray().toArray(),
  body('subtotal').isInt().toInt(),
  body('method').isInt().toInt(),
  body('shippingfee').isInt().toInt(),
  body('deliveryaddress').optional().isMongoId(),
  body('longitude').optional().isFloat().toFloat(),
  body('latitude').optional().isFloat().toFloat(),
  body('address').optional().isString(),
  body('note').optional().isString(),
  body('phone').optional().isNumeric().isLength({ min: 10, max: 10 }),
  // body('promocodes').isArray(),
  validateInput,
  jwtAuthentication,
  addOrder
);

// router.put(
//   '/:id',
//   param('id').notEmpty().isMongoId(),
//   body('city').isInt(),
//   body('district').isInt(),
//   body('ward').isInt(),
//   body('street').notEmpty(),
//   body('longitude').isFloat().toFloat(),
//   body('latitude').isFloat().toFloat(),
//   body('phone').isNumeric().isLength({ min: 10, max: 10 }),
//   validateInput,
//   updateDeliveryAddress
// );

// router.delete(
//   '/:id',
//   param('id').notEmpty().isMongoId(),
//   validateInput,
//   deleteDeliveryAddress
// );

export default router;
