import { Food, Image } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";
import rn from "random-number";
const gen = rn.generator({
  min: 1,
  max: 100000000,
  integer: true,
});

export async function createFood(req, res) {
  const { name, avatar, price, status, options } = req.body;
  const avatarUrl = (await Image.findById(avatar).select("Url").exec())?.Url;
  if (!avatarUrl) return res.send(nomalizeResponse(null, 7)); // avatar khong co
  const food = new Food({
    Name: name,
    FoodCategory: req.data.foodcategory.id,
    OriginalPrice: price,
    Avatar: avatarUrl,
    Status: status,
  });

  const fixedOptions: any[] = [];
  if (options?.length > 0) {
    for (let i = 0; i < options.length; i++) {
      const { ismandatory, name, maxselect, items } = options[i];
      const fixedOption: any = { Items: [] };
      if (!(name?.length > 0)) return res.send(nomalizeResponse(null, 5)); // body cua options sai
      fixedOption.Name = name;
      if (typeof ismandatory == "boolean")
        fixedOption.IsMandatory = ismandatory;
      if (typeof maxselect == "number") fixedOption.MaxSelect = maxselect;
      fixedOption.id = gen();
      if (items?.length > 0) {
        for (let j = 0; j < options[i].items.length; j++) {
          const { price, isdefault, name, maxquantity } = items[j];
          const fixedItem: any = {};
          if (!(name?.length > 0) || !(price >= 0))
            return res.send(nomalizeResponse(null, 6)); // body cua items sai
          fixedItem.Name = name;
          fixedItem.Original = price;
          if (typeof isdefault == "boolean") fixedItem.IsDefault = isdefault;
          if (maxquantity > 0) fixedItem.maxquantity = maxquantity;
          fixedItem.id = gen();
          fixedOption.Items.push(fixedItem);
        }
      }
      fixedOptions.push(fixedOption);
    }
  }
  food.Options = fixedOptions;
  const saved = await food.save();
  res.send(nomalizeResponse(saved.toObject({ virtuals: true })));
}

export async function getFoods(req, res) {
  const categories = (
    await Food.find({
      FoodCategory: req.data.foodcategory,
      Status: {
        $gt: -2, // deleted
      },
    })
      .sort({ Order: 1 })
      .select("-FoodCategory -Type")
      .exec()
  ).map((c) => {
    const t = c.toObject();
    t.id = t._id;
    delete t._id;
    return t;
  });

  res.send(nomalizeResponse(categories));
}

export async function getFood(req, res) {
  const found = (
    await Food.findOne({
      _id: req.params.id,
      Status: {
        $gt: -2, // deleted
      },
    })
      .select("-FoodCategory -Type")
      .exec()
  )?.toObject({ virtuals: true });

  if (!found) return res.send(nomalizeResponse(null, 4)); // khong tim thay mon an
  delete found._id;
  res.send(nomalizeResponse(found));
}

export async function deleteFood(req, res) {
  const deleted = await Food.findByIdAndUpdate(
    req.params.id,
    { Status: -2 },
    { new: true }
  )
    .select("-FoodCategory -Type")
    .exec();
  if (!deleted) return res.send(nomalizeResponse(null, 4)); // khong tim thay mon an
  delete deleted._id;
  res.send(nomalizeResponse(deleted.toObject({ virtuals: true })));
}

export async function createOption(req, res) {
  const { ismandatory, name, maxselect, items } = req.body;
  const fixedOption: any = { Items: [] };
  fixedOption.Name = name;
  fixedOption.IsMandatory = ismandatory;
  fixedOption.MaxSelect = maxselect;
  fixedOption.id = gen();
  if (items?.length > 0) {
    for (let j = 0; j < items.length; j++) {
      const { price, isdefault, name, maxquantity } = items[j];
      const fixedItem: any = {};
      if (!(name?.length > 0) || !(price >= 0))
        return res.send(nomalizeResponse(null, 6)); // body cua items sai
      fixedItem.Name = name;
      fixedItem.Original = price;
      if (typeof isdefault == "boolean") fixedItem.IsDefault = isdefault;
      if (maxquantity > 0) fixedItem.maxquantity = maxquantity;
      fixedItem.id = gen();
      fixedOption.Items.push(fixedItem);
    }
  }

  const updated = await Food.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        Options: fixedOption,
      },
    },
    { new: true }
  ).exec();

  if (!updated) return res.send(nomalizeResponse(null, 4)); // khong tim thay mon an

  res.send(nomalizeResponse(updated.toObject({ virtuals: true })));
}

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
