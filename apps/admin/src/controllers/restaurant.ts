import { City, Restaurant } from "@vohoaian/datn-models";
import { Constants } from "../environments/base";
import { nomalizeResponse } from "../utils/normalize";
import geocoder from "../utils/geocoder";

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

export async function updateRestaurantInfo(req, res) {
  const { name, openAt, closeAt, anouncement } = req.body;
  const { restaurant } = req.data;
  try {
    const result = await Restaurant.findByIdAndUpdate(
      { _id: restaurant._id },
      {
        Name: name,
        CloseAt: closeAt,
        OpenAt: openAt,
        Anouncement: anouncement,
      },
      { new: true }
    ).exec();
    console.log(result);

    res.send(nomalizeResponse(result, 0));
  } catch (error) {
    console.log(`[ERROR] delete res ${error}`);
    return res.send(nomalizeResponse(null, Constants.SERVER.UPDATE_RES_ERROR));
  }
}

export async function updateRestaurantAddress(req, res) {
  const { address, ward, district, city } = req.body;
  const { restaurant } = req.data;
  const resAddress = {
    Street: address,
    Ward: ward,
    District: district,
    City: city,
  };
  let latitude, longitude;
  try {
    const tempAddress = `${address}, ${ward}, ${district}, ${city}`;
    const result = await geocoder.geocode(tempAddress);

    latitude = result[0].latitude;
    longitude = result[0].longitude;
  } catch (error) {
    console.log(`[ERROR] get location ${error}`);
    return res.send(nomalizeResponse(null, Constants.CALL_API_ERROR));
  }
  try {
    const result = await Restaurant.findByIdAndUpdate(
      { _id: restaurant._id },
      {
        Location: { type: "Point", coordinates: [longitude, latitude] },
        Address: resAddress,
      },
      { new: true }
    ).exec();
    console.log(result);

    res.send(nomalizeResponse(result, 0));
  } catch (error) {
    console.log(`[ERROR] delete res ${error}`);
    return res.send(nomalizeResponse(null, Constants.SERVER.UPDATE_RES_ERROR));
  }
}
