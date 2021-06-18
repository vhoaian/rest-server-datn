import { Food } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";

export async function getFoods(req, res) {
  const categories = (
    await Food.find({
      FoodCategory: req.data.foodcategory,
      Status: { $gte: 0 },
    })
      .sort({ Order: 1 })
      .select("-FoodCategory -Status -Type")
      .exec()
  ).map((c) => {
    const t = c.toObject();
    t.id = t._id;
    delete t._id;
    return t;
  });

  res.send(nomalizeResponse(categories));
}
