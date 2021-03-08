const { FoodCategory } = require('@vohoaian/datn-models');
const { validationResult } = require('express-validator');

function createFoodCategory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const foodCategory = new FoodCategory({
    Name: req.body.name,
    Restaurant: req.data.restaurant,
    Status: req.body.status,
  });
  foodCategory
    .save()
    .then((doc) => {
      res.json(doc);
    })
    .catch(() => res.status(500).json({ errors: ['Error'] }));
}

function getFoodCategories(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  FoodCategory.find({ Restaurant: req.data.restaurant })
    .exec()
    .then((docs) => {
      res.json(docs);
    })
    .catch(() => res.status(500).json({ errors: ['Error'] }));
}

module.exports = { createFoodCategory, getFoodCategories };
