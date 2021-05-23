import {
  FoodCategory,
  Restaurant,
  SecondaryRestaurant,
} from '@vohoaian/datn-models';
import { validationResult } from 'express-validator';
import { nomalizeResponse } from '../utils/normalize';
import { withFilter } from '../utils/objects';
import Mongoose from 'mongoose';

// TODO: nhận vị trí và địa chỉ
// export async function createRestaurant(req, res) {
//   try {
//     const restaurant = new Restaurant({
//       Name: req.body.name,
//       ContractID: req.body.contractID,
//       // Address: req.body.address,
//       OpenAt: req.body.openAt,
//       CloseAt: req.body.closeAt,
//       // Location: ?
//       // Type: 0,
//       Description: req.body.description,
//       Avatar: req.body.avatar,
//       Anouncement: req.body.anouncement,
//       ParkingFee: req.body.parkingFee,
//       Status: req.body.status,
//     });

//     await restaurant.save();
//     res.send(nomalizeResponse(restaurant));
//   } catch (error) {
//     res.send(nomalizeResponse(null, 10));
//   }
// }

function findNearRestaurants(latitude, longitude): Promise<RestaurantQuery[]> {
  return SecondaryRestaurant.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        distanceField: 'Distance',
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
    page,
    perpage,
    sort,
    latitude,
    longitude,
    keyword,
    city,
    types,
    area,
  } = req.query; // phan trang/ vi tri/ sap xep
  let restaurantsByDistance: RestaurantQuery[] = [] as any;
  let restaurantsByKeyword: RestaurantQuery[] = [] as any;
  let restaurants: RestaurantQuery[] = [] as any;
  let resolvedRestaurants = [] as any;

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
    resolvedRestaurants = await Restaurant.find({}).exec();
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
      }).exec();
    } /*if (sort == 0)*/ else {
      // SX theo liên quan

      if (!haveKeyword) {
        resolvedRestaurants = await Restaurant.find({}).exec();
      } else {
        restaurants =
          restaurantsByDistance.length == 0
            ? restaurantsByKeyword
            : commonRestaurant(restaurantsByKeyword, restaurantsByDistance);

        resolvedRestaurants = await Restaurant.find({
          _id: {
            $in: restaurants.map((r) => r.Restaurant),
          },
        }).exec();
      }
    }
  }

  let result = await Promise.all(
    resolvedRestaurants.map(async (r, i) => {
      const o = r.toObject({ virtuals: true });
      o.IsOpening = await r.isOpening();
      return withFilter(
        'Name FullAddress OpenHours id Avatar IsOpening Distance'
      )(o);
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

  res.send(
    nomalizeResponse(result.slice((page - 1) * perpage, page * perpage), 0, {
      totalPage: Math.ceil(resolvedRestaurants.length / perpage),
      currentPage: page,
      perPage: perpage,
      total: result.length,
    })
  );
}

export function getRestaurantInfo(req, res) {
  const { restaurant } = req.data;
  res.send(nomalizeResponse(restaurant));
}

export async function getFoodsOfRestaurant(req, res) {
  const categories = (
    await FoodCategory.find({
      Restaurant: req.params.restaurant,
    })
      .populate({
        path: 'Foods',
        select: '-Type -Status',
        options: { sort: { Order: 1 } },
      })
      .select('-Status -Restaurant')
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
