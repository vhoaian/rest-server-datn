import { Restaurant, SecondaryRestaurant } from '@vohoaian/datn-models';
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

function findRelatedRestaurants(keyword): Promise<RestaurantQuery[]> {
  return SecondaryRestaurant.aggregate([
    { $match: { $text: { $search: keyword } } },
    { $project: { Restaurant: 1, _id: 0 } },
  ]).exec();
}

function commonRestaurant(
  a1: RestaurantQuery[],
  a2: RestaurantQuery[]
): RestaurantQuery[] {
  return a1
    .filter((x) => a2.some((y) => x.Restaurant.equals(y.Restaurant)))
    .map((x, i) => ({
      ...x,
      Distance: x.Distance ?? a2[i].Distance,
    }));
}

type RestaurantQuery = {
  Restaurant: Mongoose.Types.ObjectId;
  Distance?: number;
};

// TODO: Đặt danh sách từ khoá sắp xếp
export async function getRestaurants(req, res) {
  const { page, perpage, sort, latitude, longitude, keyword } = req.query; // phan trang/ vi tri/ sap xep
  let restaurantsByDistance: RestaurantQuery[] = [] as any;
  let restaurantsByKeyword: RestaurantQuery[] = [] as any;
  let restaurants: RestaurantQuery[] = [] as any;
  let resolvedRestaurants = [] as any;

  // Tìm theo khoảng cách (nếu có long và lat)
  if (longitude && latitude) {
    restaurantsByDistance = await findNearRestaurants(latitude, longitude);
  }

  // Tìm theo liên quan (nếu có keyword)
  if (keyword.length > 0) {
    restaurantsByKeyword = await findRelatedRestaurants(keyword);
  }

  if (!(longitude && latitude) && keyword.length == 0) {
    // Nếu không có long, lat và keyword => lấy tất cả
    resolvedRestaurants = await Restaurant.find({}).exec();
  } else {
    // Nếu có 1 trong 2 hoặc cả 2
    if (sort == 'distance') {
      // SX theo khoảng cách
      if (longitude && latitude) {
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
    } else if (sort == 'relate') {
      // SX theo liên quan

      if (keyword.length == 0) {
        // TODO
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

  const result = await Promise.all(
    resolvedRestaurants.map(async (r, i) => {
      const o = r.toObject({ virtuals: true });
      o.Distance = restaurants[i]?.Distance;
      o.IsOpening = await r.isOpening();

      return withFilter(
        'Name FullAddress OpenHours id Avatar IsOpening Distance'
      )(o);
    })
  );

  res.send(
    nomalizeResponse(result.slice((page - 1) * perpage, page * perpage), 0, {
      totalPage: Math.ceil(resolvedRestaurants.length / perpage),
      currentPage: page,
      perPage: perpage,
    })
  );
}

export function getRestaurantInfo(req, res) {
  const { restaurant } = req.data;
  res.send(nomalizeResponse(restaurant));
}
