const { Food } = require('@vohoaian/datn-models');
const { validationResult } = require('express-validator');

function createFood(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const food = new Food({
    Name: req.body.name,
    FoodCategory: req.data.foodcategory,
    OriginalPrice: req.body.originalPrice,
    Images: req.body.images,
    Type: req.body.type,
    Status: req.body.status,
  });
  food
    .save()
    .then((doc) => {
      res.json(doc);
    })
    .catch(() => res.status(500).json({ errors: ['Error'] }));
}

function getFoods(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  Food.find({ FoodCategory: req.data.foodcategory })
    .exec()
    .then((docs) => {
      res.json(docs);
    })
    .catch(() => res.status(500).json({ errors: ['Error'] }));
}

module.exports = { createFood, getFoods };
