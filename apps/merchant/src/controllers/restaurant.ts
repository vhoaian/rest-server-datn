import {
  FoodCategory,
  Manager,
  Order,
  Restaurant,
  Setting,
} from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";
import { withFilter } from "../utils/objects";
import mongoose from "mongoose";
import moment from "moment";
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

export async function getStatistics(req, res) {
  const restaurant = req.params.restaurant;
  const found = await Restaurant.findById(restaurant).exec();
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
  if (!found) {
    response = { errorCode: 2, data: null }; // khong ton tai
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
        Restaurant: mongoose.Types.ObjectId(restaurant),
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
                      then: "$Subtotal",
                    },
                  ],
                  default: 0,
                },
              },
            },
          },
        },
      ]).exec();
      const settingFee = await Setting.getSetting();
      response = {
        errorCode: 0,
        data: withFilter("Income Count IncomeByCash PercentFeeMerchant")({
          ...(info[0] ?? { Income: 0, Count: 0, IncomeByCash: 0 }),
          PercentFeeMerchant: settingFee.PercentFeeMerchant,
        }),
      };
    }
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
}
