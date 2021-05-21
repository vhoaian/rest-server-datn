import { Food } from '@vohoaian/datn-models';
import { validationResult } from 'express-validator';
import { nomalizeResponse } from '../utils/normalize';

// export function createFood(req, res) {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   const food = new Food({
//     Name: req.body.name,
//     FoodCategory: req.data.foodcategory,
//     OriginalPrice: req.body.originalPrice,
//     Images: req.body.images,
//     Type: req.body.type,
//     Status: req.body.status,
//   });
//   food
//     .save()
//     .then((doc) => {
//       res.send(nomalizeResponse(doc));
//     })
//     .catch(() => res.status(500).json({ errors: ['Error'] }));
// }

export function getFoods(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  Food.find({ FoodCategory: req.data.foodcategory })
    .exec()
    .then((docs) => {
      res.send(nomalizeResponse(docs));
    })
    .catch(() => res.status(500).json({ errors: ['Error'] }));
}

// export function deleteFood(req, res) {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   Food.findByIdAndUpdate(
//     req.data.food,
//     { Status: 10 },
//     { new: true, useFindAndModify: false }
//   )
//     .exec()
//     .then((docs) => {
//       res.send(nomalizeResponse(docs));
//     })
//     .catch(() => res.status(500).json({ errors: ['Error'] }));
// }

// export function updateFood(req, res) {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   Food.findByIdAndUpdate(
//     req.data.food,
//     {
//       Name: req.body.name ? req.body.name : req.data.food.Name,
//       FoodCategory: req.data.destfoodcategory
//         ? req.data.destfoodcategory
//         : req.data.foodcategory,
//       OriginalPrice: req.body.originalPrice
//         ? req.body.originalPrice
//         : req.data.food.OriginalPrice,
//       Images: req.body.images ? req.body.images : req.data.food.Images,
//       Type: req.body.type ? req.body.type : req.data.food.Type,
//       Status: req.body.status ? req.body.status : req.data.food.Status,
//     },
//     { new: true, useFindAndModify: false }
//   )
//     .exec()
//     .then((docs) => {
//       res.send(nomalizeResponse(docs));
//     })
//     .catch(() => res.status(500).json({ errors: ['Error'] }));
// }

// export async function getFoodsOfRestaurant(req, res) {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }
//   const { restaurant } = req.params;
//   const { success, message, data } = await foodService.getFoodsOfRestaurant(
//     restaurant
//   );

//   res.send(nomalizeResponse(success, message, data));
// }
