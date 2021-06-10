import { Food, Image } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";
import rn from "random-number";
import ggAPI from "@rest-servers/google-api";
import path from "path";
import fs from "fs";

const gen = rn.generator({
  min: 1,
  max: 100000000,
  integer: true,
});

export async function createFood(req, res) {
  const { name, price, status, options } = req.body;
  const uploaded = req.file;
  const filePath = path.join(process.cwd(), uploaded.path);
  const FILE = {
    name: uploaded.filename,
    type: uploaded.mimetype,
    path: filePath,
  };

  const food = new Food({
    Name: name,
    FoodCategory: req.data.foodcategory.id,
    OriginalPrice: price,
    Order: await Food.countDocuments({
      FoodCategory: req.data.foodcategory._id,
    }),
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
          fixedItem.OriginalPrice = price;
          if (typeof isdefault == "boolean") fixedItem.IsDefault = isdefault;
          if (maxquantity > 0) fixedItem.MaxQuantity = maxquantity;
          fixedItem.id = gen();
          fixedOption.Items.push(fixedItem);
        }
      }
      fixedOptions.push(fixedOption);
    }
  }
  food.Options = fixedOptions;
  // upload len gg drive
  try {
    const img = await ggAPI.uploadFile(FILE);
    // ggAPI.deleteFile(img.webContentLink);
    const newImage = await Image.create({
      Sender: {
        Id: (req.user as any).id,
        Role: 2,
      },
      Url: img.webContentLink,
    });
    food.Avatar = img.webContentLink as string;
  } catch (e) {
    res.status(500).end();
  } // server khong the upload
  // xoa file
  fs.unlinkSync(filePath);

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

export async function updateFood(req, res) {
  const { name, price, status, order } = req.body;
  const _food: any = {};
  if (name?.length > 0) _food.Name = name;
  if (price >= 0) _food.Price = price;
  if (status >= -2) _food.Status = status;
  if (order >= 0) _food.Order = order;
  const deleted = await Food.findByIdAndUpdate(req.params.id, _food, {
    new: true,
  })
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
      fixedItem.OriginalPrice = price;
      if (typeof isdefault == "boolean") fixedItem.IsDefault = isdefault;
      if (maxquantity > 0) fixedItem.MaxQuantity = maxquantity;
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

export async function createItem(req, res) {
  const { price, isdefault, name, maxquantity } = req.body;
  const fixedItem: any = {};
  fixedItem.Name = name;
  fixedItem.OriginalPrice = price;
  fixedItem.id = gen();
  fixedItem.IsDefault = isdefault;
  fixedItem.MaxQuantity = maxquantity;
  const updated = await Food.findOneAndUpdate(
    { _id: req.params.id, "Options.id": req.params.opt },
    {
      $push: {
        "Options.$.Items": fixedItem,
      },
    },
    { new: true }
  ).exec();

  if (!updated) return res.send(nomalizeResponse(null, 4)); // khong tim thay mon an

  res.send(nomalizeResponse(updated.toObject({ virtuals: true })));
}

export async function updateItem(req, res) {
  const { price, isdefault, name, maxquantity } = req.body;
  const id = req.params.item;
  const fixedItem: any = {};
  if (name?.length > 0) fixedItem["Options.0.Items.$.Name"] = name;
  if (price >= 0) fixedItem["Options.0.Items.$.OriginalPrice"] = price;
  if (typeof isdefault == "boolean")
    fixedItem["Options.0.Items.$.IsDefault"] = isdefault;
  if (maxquantity > 0) fixedItem["Options.0.Items.$.MaxQuantity"] = maxquantity;

  const updated = await Food.findOneAndUpdate(
    {
      _id: req.params.id,
      "Options.id": req.params.opt,
      "Options.Items.id": id,
    },
    {
      $set: fixedItem,
    },
    { new: true }
  ).exec();

  if (!updated) return res.send(nomalizeResponse(null, 4)); // khong tim thay mon an

  res.send(nomalizeResponse(updated.toObject({ virtuals: true })));
}

export async function updateOption(req, res) {
  const { ismandatory, name, maxselect } = req.body;
  const fixedOption: any = {};
  if (name?.length > 0) fixedOption["Options.$.Name"] = name;
  if (typeof ismandatory == "boolean")
    fixedOption["Options.$.IsMandatory"] = ismandatory;
  if (maxselect > 0) fixedOption["Options.$.MaxSelect"] = maxselect;

  const updated = await Food.findOneAndUpdate(
    {
      _id: req.params.id,
      "Options.id": req.params.opt,
    },
    {
      $set: fixedOption,
    },
    { new: true }
  ).exec();

  if (!updated) return res.send(nomalizeResponse(null, 4)); // khong tim thay mon an

  res.send(nomalizeResponse(updated.toObject({ virtuals: true })));
}

export async function deleteOption(req, res) {
  const deleted = await Food.findByIdAndUpdate(
    req.params.id,
    {
      $pull: {
        Options: {
          id: req.params.opt,
        },
      },
    },
    { new: true }
  ).exec();

  if (!deleted) return res.send(nomalizeResponse(null, 4)); // khong tim thay mon an

  res.send(nomalizeResponse(deleted.toObject({ virtuals: true })));
}

export async function deleteItem(req, res) {
  const deleted = await Food.findOneAndUpdate(
    { _id: req.params.id, "Options.id": req.params.opt },
    {
      $pull: {
        "Options.$.Items": {
          id: req.params.item,
        },
      },
    },
    { new: true }
  ).exec();

  if (!deleted) return res.send(nomalizeResponse(null, 4)); // khong tim thay mon an

  res.send(nomalizeResponse(deleted.toObject({ virtuals: true })));
}
