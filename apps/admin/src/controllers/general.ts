import { nomalizeResponse } from "../utils/normalize";
import { Constants } from "../environments/base";
import { Restaurant, User, Order, Shipper } from "@vohoaian/datn-models";
import { getStartAndEndOfWeek } from "../utils/startAndEndOfWeek";

export async function getGeneralStatistics(req, res) {
  try {
    const total = await Promise.all([
      Restaurant.countDocuments({}).exec(),
      User.countDocuments({}).exec(),
      Shipper.countDocuments({}).exec(),
    ]);
    //some statistics to do
    /* */
    const presentWeek = getStartAndEndOfWeek(Date.now(), 0);
    const preWeek = getStartAndEndOfWeek(Date.now(), 1);
    let option = {};
    option = {
      CreatedAt: { $gte: presentWeek[0], $lte: presentWeek[1] },
      Status: 0,
    };
    let orders: any = await Order.find(option)
      .select("Total CreatedAt AdditionalFees")
      .exec();
    const preOrders = await Order.find({
      CreatedAt: { $gte: preWeek[0], $lte: preWeek[1] },
      Status: 0,
    })
      .select("Total CreatedAt AdditionalFees")
      .exec();

    let paymentOfPreWeek = 0;
    preOrders.forEach((order) => {
      paymentOfPreWeek += order.Total;
    });

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

    //devoloper percent
    let numberPercent, paymentPercent;

    if (orders.length > preOrders.length) {
      numberPercent = 100 - Math.ceil((orders.length * 100) / preOrders.length);
    } else {
      numberPercent = -(
        100 - Math.ceil((orders.length * 100) / preOrders.length)
      );
    }

    if (totalPayment > paymentOfPreWeek) {
      paymentPercent = 100 - Math.ceil((totalPayment * 100) / paymentOfPreWeek);
    } else {
      paymentPercent = -(
        100 - Math.ceil((totalPayment * 100) / paymentOfPreWeek)
      );
    }

    res.send(
      nomalizeResponse(
        {
          totalRestaurants: total[0],
          totalUsers: total[1],
          totalShippers: total[2],
          totalOrders: orders.length,
          totalPayment,
          numberOfOrderInWeek,
          payOfOrderInWeek,
          paymentPercent,
          numberPercent,
        },
        0
      )
    );
  } catch (error) {
    console.log(`[ERROR] get general info: ${error}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_GENERAL_ERROR));
  }
}
