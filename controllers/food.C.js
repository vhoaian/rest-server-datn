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

function deleteFood(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  Food.findByIdAndUpdate(
    req.data.food,
    { Status: 10 },
    { new: true, useFindAndModify: false }
  )
    .exec()
    .then((docs) => {
      res.json(docs);
    })
    .catch(() => res.status(500).json({ errors: ['Error'] }));
}

function updateFood(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  Food.findByIdAndUpdate(
    req.data.food,
    {
      Name: req.body.name ? req.body.name : req.data.food.Name,
      FoodCategory: req.data.destfoodcategory
        ? req.data.destfoodcategory
        : req.data.foodcategory,
      OriginalPrice: req.body.originalPrice
        ? req.body.originalPrice
        : req.data.food.OriginalPrice,
      Images: req.body.images ? req.body.images : req.data.food.Images,
      Type: req.body.type ? req.body.type : req.data.food.Type,
      Status: req.body.status ? req.body.status : req.data.food.Status,
    },
    { new: true, useFindAndModify: false }
  )
    .exec()
    .then((docs) => {
      res.json(docs);
    })
    .catch(() => res.status(500).json({ errors: ['Error'] }));
}
module.exports = { createFood, getFoods, deleteFood, updateFood };
