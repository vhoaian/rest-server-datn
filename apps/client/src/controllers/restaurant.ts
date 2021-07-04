import {
  FoodCategory,
  Restaurant,
  RestaurantReview,
  SecondaryRestaurant,
} from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";
import { withFilter } from "../utils/objects";
import Mongoose from "mongoose";

function findNearRestaurants(latitude, longitude): Promise<RestaurantQuery[]> {
  return SecondaryRestaurant.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        distanceField: "Distance",
        maxDistance: 50000,
      },
    },
    {
      $project: {
        Restaurant: 1,
        _id: 0,
        Distance: 1,
      },
    },
  ]).exec();
}

async function findRelatedRestaurants(keyword): Promise<RestaurantQuery[]> {
  const result = await SecondaryRestaurant.aggregate([
    { $match: { $text: { $search: keyword } } },
    { $project: { Restaurant: 1, _id: 0 } },
  ]).exec();

  for (let i = 0; i < result.length; i++) result[i].RelatePoint = i;
  return result;
}

function commonRestaurant(
  a1: RestaurantQuery[],
  a2: RestaurantQuery[]
): RestaurantQuery[] {
  const result = [] as RestaurantQuery[];

  for (let i = 0; i < a1.length; i++) {
    for (let j = 0; j < a2.length; j++) {
      if (a1[i].Restaurant.equals(a2[j].Restaurant)) {
        result.push({
          ...a1[i],
          Distance: a1[i].Distance ?? a2[j].Distance,
          RelatePoint: a1[i].RelatePoint ?? a2[j].RelatePoint,
        });
        break;
      }
    }
  }
  return result;
}

type RestaurantQuery = {
  Restaurant: Mongoose.Types.ObjectId;
  Distance?: number;
  RelatePoint?: number;
};

export async function getRestaurants(req, res) {
  const {
    // phân trang
    page,
    perpage,
    // sắp xếp
    sort,
    // vị trí
    latitude,
    longitude,
    // từ khoá
    keyword,
    // lọc
    city,
    types,
    districts,
  } = req.query; // phan trang/ vi tri/ sap xep
  let restaurantsByDistance: RestaurantQuery[] = [] as any;
  let restaurantsByKeyword: RestaurantQuery[] = [] as any;
  let restaurants: RestaurantQuery[] = [] as any;
  let resolvedRestaurants = [] as any;

  const filter: { City?: number; District?: any; Categories?: any } = {};
  if (typeof city == "number") filter.City = city;
  if (typeof types == "object")
    filter.Categories = {
      $in: types,
    };
  if (typeof districts == "object")
    filter.District = {
      $in: districts,
    };

  const haveLocation = longitude && latitude;
  const haveKeyword = keyword.length > 0;
  // Tìm theo khoảng cách (nếu có long và lat)
  if (haveLocation) {
    restaurantsByDistance = await findNearRestaurants(latitude, longitude);
  }

  // Tìm theo liên quan (nếu có keyword)
  if (haveKeyword) {
    restaurantsByKeyword = await findRelatedRestaurants(keyword);
  }

  if (!haveLocation && !haveKeyword) {
    resolvedRestaurants = await Restaurant.find({ ...filter }).exec();
  } else {
    // Nếu có 1 trong 2 hoặc cả 2
    if (sort === 1) {
      // SX theo khoảng cách
      if (haveLocation) {
        // Có toạ độ
        restaurants =
          restaurantsByKeyword.length == 0 && keyword.length == 0
            ? restaurantsByDistance
            : restaurantsByKeyword.length == 0
            ? restaurantsByKeyword
            : commonRestaurant(restaurantsByDistance, restaurantsByKeyword);
      } else {
        // Không có toạ độ => SX theo keyword
        restaurants = restaurantsByKeyword;
      }

      resolvedRestaurants = await Restaurant.find({
        _id: {
          $in: restaurants.map((r) => r.Restaurant),
        },
        ...filter,
      }).exec();
    } /*if (sort == 0)*/ else {
      // SX theo liên quan

      if (!haveKeyword) {
        resolvedRestaurants = await Restaurant.find({ ...filter }).exec();
      } else {
        restaurants =
          restaurantsByDistance.length == 0
            ? restaurantsByKeyword
            : commonRestaurant(restaurantsByKeyword, restaurantsByDistance);

        resolvedRestaurants = await Restaurant.find({
          _id: {
            $in: restaurants.map((r) => r.Restaurant),
          },
          ...filter,
        }).exec();
      }
    }
  }

  let result: any = await Promise.all(
    resolvedRestaurants.map(async (r, i) => {
      const o = r.toObject({ virtuals: true });
      o.IsOpening = await r.isOpening();
      o.TotalReviews = await RestaurantReview.countDocuments({
        Restaurant: o.id,
      });
      return withFilter(
        "Name FullAddress OpenHours id Avatar IsOpening Distance Categories IsPartner Rating TotalReviews Status"
      )(o);
      // Total reviews
    })
  );

  if (restaurants.length > 0) {
    const temp = [] as any;
    for (let i = 0; i < restaurants.length; i++) {
      for (let j = 0; j < result.length; j++) {
        if (restaurants[i].Restaurant.equals((result as any)[j].id)) {
          temp.push({
            ...(result as any)[j],
            Distance: restaurants[i]?.Distance,
          });
          break;
        }
      }
    }
    result = temp;
  }
  // sort result
  result = result
    .sort((a: any, b: any) => b.IsPartner - a.IsPartner)
    .sort((a: any, b: any) => b.IsOpening - a.IsOpening);
  // loc nha hang
  result = result.filter((r: any) => r.Status >= 0);

  res.send(
    nomalizeResponse(result.slice((page - 1) * perpage, page * perpage), 0, {
      totalPage: Math.ceil(result.length / perpage),
      currentPage: page,
      perPage: perpage,
      total: result.length,
    })
  );
}

export async function getRestaurantInfo(req, res) {
  const { restaurant } = req.data;
  restaurant.TotalReviews = await RestaurantReview.countDocuments({
    Restaurant: restaurant.id,
  });

  res.send(nomalizeResponse(restaurant));
}

export async function getFoodsOfRestaurant(req, res) {
  const categories = (
    await FoodCategory.find({
      Restaurant: req.params.restaurant,
    })
      .populate({
        path: "Foods",
        select: "-Type -Status",
        match: {
          Status: {
            $gte: 0,
          },
        },
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
