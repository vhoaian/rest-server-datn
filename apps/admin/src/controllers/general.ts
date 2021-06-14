import { nomalizeResponse } from "../utils/normalize";
import { Constants } from "../environments/base";
import {
  Restaurant,
  User,
  Order,
  Shipper,
  Receipt,
} from "@vohoaian/datn-models";
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
    const today = new Date();
    if (filter === "week") {
      present = getStartAndEndOfWeek(today, 0);
      past = getStartAndEndOfWeek(today, 1);
    } else if (filter === "month") {
      present = getStartAndEndOfMonth(today, 0);
      past = getStartAndEndOfMonth(today, 1);
    } else {
      present = getStartAndEndOfYear(today, 0);
      past = getStartAndEndOfYear(today, 1);
    }

    const orders = await Order.find({
      //order was created in this week, month , year
      CreatedAt: { $gte: present[0], $lte: present[1] },
      Status: { $gte: 0 },
    })
      .select("Total CreatedAt AdditionalFees")
      .exec();

    const preOrders = await Order.find({
      //order was created in this week, month, year
      CreatedAt: { $gte: past[0], $lte: past[1] },
      Status: { $gte: 0 },
    })
      .select("Total CreatedAt AdditionalFees")
      .exec();
    // total order of last wek, moth, year
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

    //devolopement percent
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
    //get payment of restaurant & shipper
    const receipts = await Receipt.find({
      "Payer.Role": { $in: [1, 2] },
      DateStart: {
        $gte: new Date(today.getFullYear(), today.getMonth(), 0),
      },
    }).exec();

    const shipperData = ["Tài xế", "10%", 0, 0];
    const restaurantData = ["Nhà hàng", "10%", 0, 0];

    receipts.forEach((receipt: any) => {
      if (parseInt(receipt.Payer.Role) == 1) {
        if (receipt.Status === 1) {
          shipperData[2] += receipt.FeeTotal;
        } else {
          shipperData[3] += receipt.FeeTotal;
        }
      } else if (parseInt(receipt.Payer.Role) == 2) {
        if (receipt.Status === 1) {
          restaurantData[2] += receipt.FeeTotal;
        } else {
          restaurantData[3] += receipt.FeeTotal;
        }
      }
    });

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
          shipperData,
          restaurantData,
        },
        0
      )
    );
  } catch (error) {
    console.log(`[ERROR] get general info: ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_GENERAL_ERROR));
  }
}
