import { City, Manager, Restaurant } from "@vohoaian/datn-models";
import { Constants } from "../environments/base";
import { nomalizeResponse } from "../utils/normalize";
import geocoder from "../utils/geocoder";
import path from "path";
import fs from "fs";
import ggAPI from "@rest-servers/google-api";
import moment from "moment";

export async function deleteRestaurant(req, res) {
  const { restaurant } = req.data;
  try {
    const deletedRestaurant = await Restaurant.findByIdAndUpdate(
      { _id: restaurant.id },
      { Status: -1 }
    ).exec();

    return res.send(nomalizeResponse(deletedRestaurant));
  } catch (error) {
    console.log(`[ERROR] delete res ${error.message}`);
    return res.send(nomalizeResponse(null, Constants.SERVER.DELETE_RES_ERROR));
  }
}

export async function getRestaurantInfo(req, res) {
  const { restaurant } = req.data;
  try {
    const cities = await City.find({}).exec();
    const manager = await Manager.find({ "Roles.Restaurant": restaurant.id })
      .select("FullName Email Phone")
      .exec();
    res.send(nomalizeResponse({ cities, restaurant, manager: manager[0] }));
  } catch (error) {
    console.log(`[ERROR] delete res ${error.message}`);
    return res.send(nomalizeResponse(null, Constants.SERVER.FIND_RES_ERROR));
  }
}

export async function updateRestaurantInfo(req, res) {
  const { name, openAt, closeAt, anouncement } = req.body;
  const uploadedFile = req.file;
  console.log({ name, openAt, closeAt, anouncement, uploadedFile });
  try {
    const filePath = path.join(process.cwd(), uploadedFile.path);
    const FILE = {
      name: uploadedFile.filename,
      type: uploadedFile.mimetype,
      path: filePath,
    };
    const { restaurant } = req.data;

    const img = await ggAPI.uploadFile(FILE);

    const result = await Restaurant.findByIdAndUpdate(
      { _id: restaurant.id },
      {
        Name: name,
        CloseAt: moment(closeAt, "HH:mm").toDate(),
        OpenAt: moment(openAt, "HH:mm").toDate(),
        Anouncement: anouncement,
        Avatar: img.webContentLink || "",
      },
      { new: true }
    ).exec();
    console.log(result);
    fs.unlinkSync(filePath);
    res.send(nomalizeResponse(result, 0));
  } catch (error) {
    console.log(`[ERROR] update info res ${error.message}`);
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
    console.log(`[ERROR] get location ${error.message}`);
    return res.send(nomalizeResponse(null, Constants.CALL_API_ERROR));
  }
  try {
    const result = await Restaurant.findByIdAndUpdate(
      { _id: restaurant.id },
      {
        Location: { type: "Point", coordinates: [longitude, latitude] },
        Address: resAddress,
      },
      { new: true }
    ).exec();

    res.send(nomalizeResponse(result, 0));
  } catch (error) {
    console.log(`[ERROR] delete res ${error.message}`);
    return res.send(nomalizeResponse(null, Constants.SERVER.UPDATE_RES_ERROR));
  }
}

export async function addPermissionForRestaurant(req, res) {
  const { fullname, phone, email, managerID } = req.body;
  const { restaurant } = req.data;

  try {
    const updatedRes = await Restaurant.findByIdAndUpdate(
      { _id: restaurant.id },
      { IsPartner: true }
    ).exec();
    const manager = await Manager.findByIdAndUpdate(
      { _id: managerID },
      {
        FullName: fullname,
        Phone: phone,
        email: email,
      }
    );

    res.send(nomalizeResponse(null, 0));
  } catch (error) {
    console.log(`[ERROR] permision res ${error.message}`);
    return res.send(
      nomalizeResponse(null, Constants.SERVER.UPDATE_PERMISION_ERROR)
    );
  }
}
