import { nomalizeResponse } from "../utils/normalize";
import { Constants } from "../environments/base";
import { Restaurant, User, Order } from "@vohoaian/datn-models";
import { getStartAndEndOfPreWeek } from "../utils/startAndEndOfPreWeek";

export async function getGeneralStatistics(req, res) {
  try {
    const total = await Promise.all([
      Restaurant.countDocuments({}).exec(),
      User.countDocuments({}).exec(),
    ]);
    //some statistics to do
    /* */
    const preWeeks = getStartAndEndOfPreWeek(Date.now());
    let option = {};
    option = { CreatedAt: { $gte: preWeeks[0], $lte: preWeeks[1] }, Status: 0 };
    let orders: any = await Order.find(option)
      .select("Total CreatedAt AdditionalFees")
      .exec();
    const numberOfOrderInWeek = new Array(7).fill(0);
    const payOfOrderInWeek = new Array(7).fill(0);
    let totalPayment = 0;
    orders = orders.map((order: any) => {
      const index =
        order.CreatedAt.getDay() === 0 ? 6 : order.CreatedAt.getDay() - 1;
      numberOfOrderInWeek[index]++;
      payOfOrderInWeek[index] += order.Total;
      totalPayment += order.Total;
    });

    //console.log({ numberOfOrderInWeek, payOfOrderinWeek });
    res.send(
      nomalizeResponse(
        {
          totalRestaurants: total[0],
          totalUsers: total[1],
          totalOrders: orders.length,
          totalPayment,
          numberOfOrderInWeek,
          payOfOrderInWeek,
        },
        0
      )
    );
  } catch (error) {
    console.log(`[ERROR] get general info: ${error}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_GENERAL_ERROR));
  }
}

export async function getNotification(req, res) {
  try {
    const reports = await Driver.find({ Solve: 0 }).exec();
    const permission = await Permission.find({ Status: 1 }).exec();
    res.send(
      nomalizeResponse(
        {
          reports,
          permission,
        },
        0
      )
    );
  } catch (error) {
    console.log(`[ERROR] get notification: ${error}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_NOTICE_ERROR));
  }
}
