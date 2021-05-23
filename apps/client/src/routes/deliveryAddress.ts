import express from 'express';
import { body, param } from 'express-validator';
import {
  addDeliveryAddress,
  deleteDeliveryAddress,
  getDeliveryAddresses,
  updateDeliveryAddress,
} from '../controllers/deliveryAddress';
import {
  validateInput,
  jwtAuthentication,
  validatePrivateResource,
} from '../middlewares/services';
const router = express.Router();

router.get('/', getDeliveryAddresses);

router.post(
  '/',
  body('city').optional().isInt(),
  body('district').optional().isInt(),
  body('ward').optional().isInt(),
  body('street').optional().notEmpty(),
  body('address').optional().isString(),
  body('longitude').isFloat().toFloat(),
  body('latitude').isFloat().toFloat(),
  body('phone').isNumeric().isLength({ min: 10, max: 10 }),
  validateInput,
  addDeliveryAddress
);

router.put(
  '/:id',
  param('id').notEmpty().isMongoId(),
  body('city').optional().isInt(),
  body('district').optional().isInt(),
  body('ward').optional().isInt(),
  body('street').optional().notEmpty(),
  body('address').optional().isString(),
  body('longitude').isFloat().toFloat(),
  body('latitude').isFloat().toFloat(),
  body('phone').isNumeric().isLength({ min: 10, max: 10 }),
  validateInput,
  updateDeliveryAddress
);

router.delete(
  '/:id',
  param('id').notEmpty().isMongoId(),
  validateInput,
  deleteDeliveryAddress
);

export default router;
