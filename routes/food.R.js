var express = require('express');
const { body, check } = require('express-validator');
const { createFood, getFoods } = require('../controllers/food.C');
var router = express.Router();

// TODO: status
router.post(
  '/',
  body('name').isString(),
  body('originalPrice').isInt({ min: 0 }),
  body('images').optional().isArray(),
  check('images.*').isURL(),
  body('type').optional().isInt(),
  createFood
);

router.get('/', getFoods);

module.exports = router;
