import { Shipper, Image, Order } from "@vohoaian/datn-models";
import mongoose from "mongoose";
import { nomalizeResponse } from "../utils/normalize";
import { withFilter } from "../utils/objects";
import ggAPI from "@rest-servers/google-api";
import path from "path";
import fs from "fs";
import moment from "moment";

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

export async function getStatistics(req, res) {
  const id = req.params.uid;
  const user = await Shipper.findById(id).exec();
  const {
    status,
    daya,
    dayb,
    montha,
    monthb,
    yeara,
    yearb,
  }: {
    daya?: string;
    dayb?: string;
    montha?: string;
    monthb?: string;
    yeara?: string;
    yearb?: string;
    status?: string[];
  } = req.query;
  let response;
  if (!user) {
    response = { errorCode: 2, data: null }; // user khong ton tai
  } else {
    const now = moment().utcOffset(7);
    const fromDate = moment.parseZone(
      `${yeara ? yeara : now.year()}-${
        montha
          ? montha.padStart(2, "0")
          : (now.month() + 1).toString().padStart(2, "0")
      }-${daya ? daya.padStart(2, "0") : "01"}T00:00:00+07:00`
    );
    const toDate = moment.parseZone(
      `${yearb ? yearb : now.year()}-${
        monthb
          ? monthb.padStart(2, "0")
          : (now.month() + 1).toString().padStart(2, "0")
      }-${
        dayb
          ? dayb.padStart(2, "0")
          : moment({
              year: yearb ? +yearb : now.year(),
              month: monthb ? +monthb - 1 : now.month(),
            }).daysInMonth()
      }T00:00:00+07:00`
    );
    const dayAfterToDate = toDate.add({ day: 1 });
    if (
      !fromDate.isValid() ||
      !toDate.isValid() ||
      !dayAfterToDate.isAfter(fromDate)
    ) {
      response = { errorCode: 3, data: null }; // ngay truyen vao khong hop le
    } else {
      const query: any = {
        Shipper: mongoose.Types.ObjectId(id),
        CreatedAt: {
          $gte: fromDate.toDate(),
          $lt: toDate.toDate(),
        },
      };
      if (status?.length) query.Status = { $in: status?.map(Number) };
      const info = await Order.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: null,
            Income: {
              $sum: "$ShippingFee",
            },
            PurchaseMoney: {
              $sum: "$Subtotal",
            },
            Count: {
              $sum: 1,
            },
            IncomeByCash: {
              $sum: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ["$PaymentMethod", 0],
                      },
                      then: "$ShippingFee",
                    },
                  ],
                  default: 0,
                },
              },
            },
          },
        },
      ]).exec();
      response = {
        errorCode: 0,
        data: withFilter("Income Count PurchaseMoney IncomeByCash")(
          info[0] ?? { Income: 0, Count: 0, PurchaseMoney: 0, IncomeByCash: 0 }
        ),
      };
    }
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
}
