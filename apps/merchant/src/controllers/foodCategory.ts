import { FoodCategory } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";

export async function createFoodCategory(req, res) {
  const foodCategory = new FoodCategory({
    Name: req.body.name,
    Restaurant: req.data.restaurant,
    Order:
      req.body.order >= 0
        ? req.body.order
        : await FoodCategory.countDocuments({
            Restaurant: req.data.restaurant,
          }),
  });
  foodCategory.save().then((doc) => {
    res.send(nomalizeResponse(doc.toObject({ virtuals: true })));
  });
}

export async function updateFoodCategory(req, res) {
  const update: any = {};
  if (typeof req.body.name == "string") update.Name = req.body.name;
  if (typeof req.body.order == "number" && req.body.order >= 0)
    update.Order = req.body.order;

  const updated = await FoodCategory.findByIdAndUpdate(req.params.id, update, {
    new: true,
  });
  // khong tim thay thu muc
  if (!updated) return res.send(nomalizeResponse(null, 3));
  else res.send(nomalizeResponse(updated.toObject({ virtuals: true })));
}

export async function deleteFoodCategory(req, res) {
  const deleted = await FoodCategory.findByIdAndUpdate(
    req.params.id,
    { Status: -2 },
    {
      new: true,
    }
  );
  // khong tim thay thu muc
  if (!deleted) return res.send(nomalizeResponse(null, 3));
  else res.send(nomalizeResponse(deleted.toObject({ virtuals: true })));
}

export async function getFoodCategories(req, res) {
  const categories = (
    await FoodCategory.find({
      Restaurant: req.data.restaurant,
      Status: {
        $gt: -2, // deleted
      },
    })
      .sort({ Order: 1 })
      .select("-Restaurant -Status")
      .exec()
  ).map((c) => {
    const t = c.toObject();
    t.id = t._id;
    delete t._id;
    return t;
  });

  res.send(nomalizeResponse(categories));
}
