import express from 'express';
import { body, param } from 'express-validator';
import {
  validateInput,
  jwtAuthentication,
  validatePrivateResource,
} from '../middlewares/services';
const router = express.Router();

// Đơn hàng của tôi
// router.get('/', getDeliveryAddresses);

// Đặt hàng
// router.post(
//   '/',
//   body('city').isInt(),
//   body('district').isInt(),
//   body('ward').isInt(),
//   body('street').notEmpty(),
//   body('longitude').isFloat().toFloat(),
//   body('latitude').isFloat().toFloat(),
//   body('phone').isNumeric().isLength({ min: 10, max: 10 }),
//   validateInput,
//   addDeliveryAddress
// );

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
