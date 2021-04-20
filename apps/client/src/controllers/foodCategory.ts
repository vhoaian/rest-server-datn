import { FoodCategory } from '@vohoaian/datn-models';
import { validationResult } from 'express-validator';
import { nomalizeResponse } from '../utils/normalize';

export function createFoodCategory(req, res) {
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
      res.send(nomalizeResponse(doc));
    })
    .catch(() => res.status(500).json({ errors: ['Error'] }));
}

export function getFoodCategories(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  FoodCategory.find({ Restaurant: req.data.restaurant })
    .exec()
    .then((docs) => {
      res.send(nomalizeResponse(docs));
    })
    .catch(() => res.status(500).json({ errors: ['Error'] }));
}
