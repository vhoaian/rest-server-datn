import { FoodCategory, Manager, Restaurant } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";
import { withFilter } from "../utils/objects";

export async function getRestaurants(req, res) {
  const manager = await Manager.findById(req.user.id)
    .populate("Roles.Restaurant", "Name Avatar")
    .exec();
  const response = manager?.Roles.map((r) => ({
    Name: (r.Restaurant as any).Name,
    Avatar: (r.Restaurant as any).Avatar,
    id: (r.Restaurant as any).id,
  }));
  res.send(nomalizeResponse(response));
}

export async function getRestaurant(req, res) {
  const restaurant = req.data.restaurant;
  const found = await Restaurant.findById(restaurant).exec();
  if (!found) return res.send(nomalizeResponse(null, 2)); // khong tim thay nha hang

  res.send(
    nomalizeResponse(
      withFilter(
        "id Status IsPartner Categories Name ContractID Avatar Anouncement Phone OpenHours FullAddress Geolocation id Wallet"
      )(found.toObject({ virtuals: true }))
    )
  );
}

export async function getFoodsOfRestaurant(req, res) {
  const categories = (
    await FoodCategory.find({
      Restaurant: req.params.restaurant,
    })
      .populate({
        path: "Foods",
        select: "-Type -Status",
        match: { Status: { $gt: -2 } },
        options: { sort: { Order: 1 } },
      })
      .select("-Status -Restaurant")
      .sort({
        Order: 1,
      })
      .exec()
  ).map((o) => {
    const t = o.toObject();
    t.id = t._id;
    delete t._id;
    t.Foods = o.Foods?.map((f) => {
      const t = f.toObject();
      t.id = t._id;
      delete t._id;
      delete (t as any).FoodCategory;
      return t;
    }) as any;
    return t;
  });

  res.send(nomalizeResponse(categories));
}
