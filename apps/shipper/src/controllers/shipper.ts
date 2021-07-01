import { Shipper, Image } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";
import { withFilter } from "../utils/objects";
import ggAPI from "@rest-servers/google-api";
import path from "path";
import fs from "fs";

const UFilter = withFilter(
  "Phone Gender Status FullName Email Avatar id Wallet Setting"
);

export async function getUser(req, res) {
  const id = req.params.uid;
  const user = await Shipper.findById(id).exec();
  let response;
  if (!user) {
    response = { errorCode: 2, data: null }; // user khong ton tai
  } else {
    const info = user.toObject({ virtuals: true });

    response = {
      errorCode: 0,
      data: UFilter(info),
    };
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
}

export async function updateUser(req, res) {
  const id = req.params.uid;
  const { email, fullname, gender } = req.body;
  const _user: any = {};
  if (email?.length > 0) _user.Email = email;
  if (fullname?.length > 0) _user.FullName = fullname;
  if (gender >= 0) _user.Gender = gender;

  let response: any;
  const updated = await Shipper.findByIdAndUpdate(id, _user, {
    new: true,
  }).exec();
  if (!updated) {
    response = { errorCode: 2, data: null }; // user khong ton tai
  } else {
    const info = updated.toObject({ virtuals: true });
    response = {
      errorCode: 0,
      data: UFilter(info),
    };
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
}

export async function updateUserAvatar(req, res) {
  const id = req.params.uid;
  const uploaded = req.file;
  const filePath = path.join(process.cwd(), uploaded.path);
  const FILE = {
    name: uploaded.filename,
    type: uploaded.mimetype,
    path: filePath,
  };
  // upload len gg drive
  try {
    const img = await ggAPI.uploadFile(FILE);
    const newImage = await Image.create({
      Sender: {
        Id: (req.user as any).id,
        Role: 2,
      },
      Url: img.webContentLink,
    });
    const updated = await Shipper.findByIdAndUpdate(
      id,
      { Avatar: img.webContentLink as string },
      {
        new: true,
      }
    ).exec();

    let response: any;
    if (!updated) {
      response = { errorCode: 2, data: null }; // user khong ton tai
    } else {
      const info = updated.toObject({ virtuals: true });
      response = {
        errorCode: 0,
        data: UFilter(info),
      };
    }
    res.send(nomalizeResponse(response.data, response.errorCode));
    // xoa file
    fs.unlinkSync(filePath);
  } catch (e) {
    res.status(500).end();
  } // server khong the upload
}

export async function updateUserSetting(req, res) {
  const id = req.params.uid;
  const { maxdistance, maxamount, minamount, maxorder } = req.body;
  const updateInfo: any = {};
  if (maxdistance >= 0) updateInfo["Setting.MaxDistance"] = maxdistance;
  if (maxorder >= 0) updateInfo["Setting.MaxOrder"] = maxorder;
  if (maxamount >= 0) updateInfo["Setting.MaxAmount"] = maxamount;
  if (minamount >= 0) updateInfo["Setting.MinAmount"] = minamount;
  const updated = await Shipper.findByIdAndUpdate(
    id,
    {
      $set: updateInfo,
    },
    { new: true }
  );
  let response: any;
  if (!updated) {
    response = { errorCode: 2, data: null }; // user khong ton tai
  } else {
    const info = updated.toObject({ virtuals: true });
    response = {
      errorCode: 0,
      data: UFilter(info),
    };
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
}
