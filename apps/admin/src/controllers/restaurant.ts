import { City, Restaurant } from "@vohoaian/datn-models";
import { Constants } from "../environments/base";
import { nomalizeResponse } from "../utils/normalize";

export async function deleteRestaurant(req, res) {
  const { id } = req.params;
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      { _id: id },
      { Status: -1 }
    ).exec();
    return res.send(nomalizeResponse(restaurant));
  } catch (error) {
    console.log(`[ERROR] delete res ${error}`);
    return res.send(nomalizeResponse(null, Constants.SERVER.DELETE_RES_ERROR));
  }
}

export async function getRestaurantInfo(req, res) {
  const { restaurant } = req.data;
  try {
    const cities = await City.find({}).exec();
    res.send(nomalizeResponse({ cities, restaurant }));
  } catch (error) {
    console.log(`[ERROR] delete res ${error}`);
    return res.send(nomalizeResponse(null, Constants.SERVER.FIND_RES_ERROR));
  }
}
