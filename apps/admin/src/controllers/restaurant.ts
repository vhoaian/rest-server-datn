import ggAPI from "@rest-servers/google-api";
import { City, Manager, Restaurant } from "@vohoaian/datn-models";
import ReceiptModel from "@vohoaian/datn-models/lib/models/Receipt";
import fs from "fs";
import moment from "moment";
import path from "path";
import { Constants } from "../environments/base";
import generatePassword from "../utils/generatePassword";
import geocoder from "../utils/geocoder";
import { nomalizeResponse } from "../utils/normalize";
import bcryptjs from "bcryptjs";

export async function deleteRestaurant(req, res) {
  const { restaurant } = req.data;
  try {
    const deletedRestaurant = await Restaurant.findByIdAndUpdate(
      { _id: restaurant.id },
      { Status: -1 }
    ).exec();
    //block manager of restaurant
    if (deletedRestaurant && deletedRestaurant.IsPartner) {
      const manager = Manager.findOneAndUpdate(
        { "Roles.Restaurant": deletedRestaurant._id },
        { Status: Constants.STATUS.BLOCK }
      ).exec();
    }

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
    //generate new password
    const newPassword = generatePassword(Constants.PASS_LENGTH);
    const hashPass = bcryptjs.hashSync(newPassword, Constants.BCRYPT_SALT);

    const manager = await Manager.findOneAndUpdate(
      {
        "Roles.Restaurant": restaurant.id,
      },
      { Password: hashPass },
      { new: true }
    )
      .select("FullName Email Phone")
      .exec();

    res.send(nomalizeResponse({ cities, restaurant, manager, newPassword }));
  } catch (error) {
    console.log(`[ERROR] delete res ${error.message}`);
    return res.send(nomalizeResponse(null, Constants.SERVER.FIND_RES_ERROR));
  }
}

export async function updateRestaurantInfo(req, res) {
  const { name, openAt, closeAt, anouncement } = req.body;
  const { restaurant } = req.data;

  const uploadedFile = req.file;
  let img: any = {};
  let filePath = "";
  try {
    if (uploadedFile) {
      filePath = path.join(process.cwd(), uploadedFile.path);
      const FILE = {
        name: uploadedFile.filename,
        type: uploadedFile.mimetype,
        path: filePath,
      };
      img = await ggAPI.uploadFile(FILE);
    }

    const result = await Restaurant.findByIdAndUpdate(
      { _id: restaurant.id },
      {
        Name: name,
        CloseAt: moment(closeAt, "HH:mm").toDate(),
        OpenAt: moment(openAt, "HH:mm").toDate(),
        Anouncement: anouncement,
        Avatar: img.webContentLink || restaurant.Avatar,
      },
      { new: true }
    ).exec();

    if (filePath !== "") fs.unlinkSync(filePath);
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

export const payReceipt = async (req, res) => {
  const { id } = req.body;
  try {
    const receipt = await ReceiptModel.findById(id);
    if (!receipt)
      throw new Error(`paid receipt ${id} fail, receipt does not exist`);

    const restaurant = await Restaurant.findById(receipt.Payer.Id);
    const manager = await Manager.findOne({ "Roles.Id": receipt.Payer.Id });

    if (!restaurant)
      throw new Error(`paid receipt ${id} fail, restaurant does not exist`);
    if (!manager)
      throw new Error(`paid receipt ${id} fail, manager does not exist`);

    receipt.Status = Constants.PAID.RESOLVE;
    manager.Status = Constants.STATUS_ACCOUNT.UNLOCK;
    restaurant.Status = Constants.RESTAURANT.OPEN_SERVICE;

    await Promise.all([receipt.save(), manager.save(), restaurant.save()]);

    console.log(`[RESTAURANT]: paid receipt ${id} success.`);
    res.send(nomalizeResponse(null, 0));
  } catch (e) {
    console.log(`[RESTAURANT]: ${e.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.PAY_RECEIPT_ERROR));
  }
};

export async function addPermissionForRestaurant(req, res) {
  const { fullname, phone, email, managerID } = req.body;
  const { restaurant } = req.data;

  try {
    const updatedRes = await Restaurant.findByIdAndUpdate(
      { _id: restaurant.id },
      { IsPartner: true }
    ).exec();

    const isManager = await Manager.findOne({ Phone: phone }).exec();
    if (isManager) {
      if (isManager.Roles.length > 0) {
        return res.send(
          nomalizeResponse(null, Constants.SERVER.UPDATE_RES_ERROR)
        );
      }

      // @ts-expect-error
      isManager.Roles = [{ Restaurant: restaurant.id }];
      await isManager.save();
      const deletedManager = await Manager.findByIdAndDelete(managerID);
    } else {
      const manager = await Manager.findById(
        { _id: managerID },
        {
          FullName: fullname,
          Phone: phone,
          email: email,
        }
      );
      if (!manager) {
        return res.send(
          nomalizeResponse(null, Constants.SERVER.UPDATE_PERMISION_ERROR)
        );
      }
    }

    res.send(nomalizeResponse(null, 0));
  } catch (error) {
    console.log(`[ERROR] permission res ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.UPDATE_PERMISION_ERROR));
  }
}

export async function reCallPermissionOfRestaurant(req, res) {
  try {
    const { restaurant } = req.data;
    const updatedRes = await Restaurant.findByIdAndUpdate(
      { _id: restaurant.id },
      { IsPartner: false }
    ).exec();
    const manager = Manager.findOneAndUpdate(
      { "Roles.Restaurant": restaurant.id },
      { Phone: "" }
    ).exec();
    if (!manager) {
      throw new Error("Can't find manager");
      return res.send(
        nomalizeResponse(null, Constants.SERVER.RECALL_PERMISION_ERROR)
      );
    }

    res.send(nomalizeResponse(null, 0));
  } catch (error) {
    console.log(`[ERROR] permision res ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.RECALL_PERMISION_ERROR));
  }
}
