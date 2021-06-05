import { nomalizeResponse } from "../utils/normalize";
import { Constants } from "../environments/base";
import { Restaurant, User, Order, Shipper } from "@vohoaian/datn-models";
import {
  getStartAndEndOfWeek,
  getStartAndEndOfMonth,
  getStartAndEndOfYear,
} from "../utils/startAndEnd";
import { statisticsTemp } from "../environments/dateTemplate";

export async function getGeneralStatistics(req, res) {
  const { filter } = req.query;
  //console.log(filter);
  try {
    const total = await Promise.all([
      Restaurant.countDocuments({}).exec(),
      User.countDocuments({}).exec(),
      Shipper.countDocuments({}).exec(),
    ]);
    //some statistics to do
    /* */
    let present: any = [];
    let past: any = [];
    if (filter === "week") {
      present = getStartAndEndOfWeek(new Date(), 0);
      past = getStartAndEndOfWeek(new Date(), 1);
    } else if (filter === "month") {
      present = getStartAndEndOfMonth(new Date(), 0);
      past = getStartAndEndOfMonth(new Date(), 1);
    } else {
      present = getStartAndEndOfYear(new Date(), 0);
      past = getStartAndEndOfYear(new Date(), 1);
    }

    const orders = await Order.find({
      CreatedAt: { $gte: present[0], $lte: present[1] },
      Status: { $gte: 0 },
    })
      .select("Total CreatedAt AdditionalFees")
      .exec();

    const preOrders = await Order.find({
      CreatedAt: { $gte: past[0], $lte: past[1] },
      Status: { $gte: 0 },
    })
      .select("Total CreatedAt AdditionalFees")
      .exec();

    let pastPayment = 0;
    preOrders.forEach((order) => {
      pastPayment += order.Total;
    });

    const numberOfOrder = statisticsTemp[filter].presentArray;
    const payOfOrder = statisticsTemp[filter].pastArray;
    let totalPayment = 0;

    //parse onrder in array of orders & payment
    orders.forEach((order: any) => {
      let index = 0;
      if (filter === "week") {
        index =
          order.CreatedAt.getDay() === 0 ? 6 : order.CreatedAt.getDay() - 1;
        numberOfOrder[index]++;
        payOfOrder[index] += order.Total;
      } else if (filter === "month") {
        index = Math.floor(order.CreatedAt.getDate() / 7);
        numberOfOrder[index]++;
        payOfOrder[index] += order.Total;
      } else {
        index = order.CreatedAt.getMonth();
        numberOfOrder[index]++;
        payOfOrder[index] += order.Total;
      }
      totalPayment += order.Total;
    });

    //devoloper percent
    let numberPercent, paymentPercent;

    if (preOrders.length > 0) {
      numberPercent = Math.ceil((orders.length * 100) / preOrders.length) - 100;
    } else if (preOrders.length === 0) {
      numberPercent = 100;
    }

    if (pastPayment > 0) {
      paymentPercent = Math.ceil((totalPayment * 100) / pastPayment) - 100;
    } else if (pastPayment === 0) {
      paymentPercent = 100;
    }

    res.send(
      nomalizeResponse(
        {
          totalRestaurants: total[0],
          totalUsers: total[1],
          totalShippers: total[2],
          totalOrders: orders.length,
          totalPayment,
          numberOfOrder,
          payOfOrder,
          paymentPercent,
          numberPercent,
          labels: statisticsTemp[filter].labels,
        },
        0
      )
    );
  } catch (error) {
    console.log(`[ERROR] get general info: ${error}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_GENERAL_ERROR));
  }
}
