import { FoodCategory } from '@vohoaian/datn-models';
import { validationResult } from 'express-validator';
import { nomalizeResponse } from '../utils/normalize';

// export function createFoodCategory(req, res) {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   const foodCategory = new FoodCategory({
//     Name: req.body.name,
//     Restaurant: req.data.restaurant,
//     Status: req.body.status,
//   });
//   foodCategory
//     .save()
//     .then((doc) => {
//       res.send(nomalizeResponse(doc));
//     })
//     .catch(() => res.status(500).json({ errors: ['Error'] }));
// }

export async function getFoodCategories(req, res) {
  const categories = (
    await FoodCategory.find({
      Restaurant: req.data.restaurant,
    })
      .sort({ Order: 1 })
      .select('-Restaurant -Status')
      .exec()
  ).map((c) => {
    const t = c.toObject();
    t.id = t._id;
    delete t._id;
    return t;
  });

  res.send(nomalizeResponse(categories));
}
