import { nomalizeResponse } from "../utils/normalize";
import { Constants } from "../environments/base";
import {
  Restaurant,
  User,
  Order,
  Shipper,
  Receipt,
  Setting,
} from "@vohoaian/datn-models";
import {
  getStartAndEndOfWeek,
  getStartAndEndOfMonth,
  getStartAndEndOfYear,
} from "../utils/startAndEnd";
import { statisticsTemp } from "../environments/dateTemplate";

function classifyOrderbyStatus(number, orders, filter) {
  const boomOrder = new Array(number).fill(0);
  const cancelOrder = new Array(number).fill(0);
  const deliveryOrder = new Array(number).fill(0);

  const cancelStatus = [
    Constants.ORDER_STATUS.CANCEL_BY_CUSTOMER,
    Constants.ORDER_STATUS.CANCEL_BY_MERCHANT,
    Constants.ORDER_STATUS.CANCEL_BY_SHIPPER,
  ];

  orders.forEach((order: any) => {
    let index = 0;
    switch (filter) {
      case "week":
        index =
          order.CreatedAt.getDay() === 0 ? 6 : order.CreatedAt.getDay() - 1;
        break;
      case "month":
        index = Math.floor(order.CreatedAt.getDate() / 7);

        break;
      case "year":
        index = order.CreatedAt.getMonth();

        break;
    }
    if (order.Status === Constants.ORDER_STATUS.BOOM) boomOrder[index]++;
    else if (cancelStatus.includes(order.Status)) cancelOrder[index]++;
    else if (order.Status === Constants.ORDER_STATUS.DELIVERED)
      deliveryOrder[index]++;
  });
  return [deliveryOrder, cancelOrder, boomOrder];
}

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
    switch (filter) {
      case "week":
        present = getStartAndEndOfWeek(today, 0);
        past = getStartAndEndOfWeek(today, 1);
        break;
      case "month":
        present = getStartAndEndOfMonth(today, 0);
        past = getStartAndEndOfMonth(today, 1);
        break;
      case "year":
        present = getStartAndEndOfYear(today, 0);
        past = getStartAndEndOfYear(today, 1);
        break;
    }

    const orders = await Order.find({
      //order was created in this week, month , year
      CreatedAt: { $gte: present[0], $lte: present[1] },
      Status: { $gte: 0 },
    })
      .select("Total CreatedAt SubTotal ShippingFee Status")
      .exec();

    const preOrders = await Order.find({
      //order was created in this week, month, year
      CreatedAt: { $gte: past[0], $lte: past[1] },
      Status: { $gte: 0 },
    })
      .select("Total SubTotal ShippingFee Status CreatedAt")
      .exec();
    // total order of last wek, moth, year
    let pastPayment = 0;
    preOrders.forEach((order) => {
      pastPayment =
        pastPayment + order.Total + order.ShippingFee + (order.Subtotal || 0);
    });

    const numberOfOrder = statisticsTemp[filter].presentArray;
    const payOfOrder = statisticsTemp[filter].pastArray;
    let totalPayment = 0;

    //parse onrder in array of orders & payment
    orders.forEach((order: any) => {
      let index = 0;
      switch (filter) {
        case "week":
          index =
            order.CreatedAt.getDay() === 0 ? 6 : order.CreatedAt.getDay() - 1;
          numberOfOrder[index]++;
          payOfOrder[index] +=
            order.Total + order.ShippingFee + (order.Subtotal || 0);
          break;
        case "month":
          index = Math.floor(order.CreatedAt.getDate() / 7);
          numberOfOrder[index]++;
          payOfOrder[index] +=
            order.Total + order.ShippingFee + (order.Subtotal || 0);
          break;
        case "year":
          index = order.CreatedAt.getMonth();
          numberOfOrder[index]++;
          payOfOrder[index] +=
            order.Total + order.ShippingFee + (order.Subtotal || 0);
          break;
      }
      totalPayment =
        totalPayment + order.Total + order.ShippingFee + (order.Subtotal || 0);
    });
    //parse order status
    const orderStatus = classifyOrderbyStatus(
      statisticsTemp[filter].number,
      orders,
      filter
    );

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
    //get fee percent setting
    const feeSettings = await Setting.find({})
      .select("PercentFeeShipper PercentFeeMerchant MAX_DAY_DELAY_PAY_RECEIPT")
      .exec();
    const shipperData = [
      "Tài xế",
      feeSettings[0].PercentFeeShipper,
      feeSettings[0].MAX_DAY_DELAY_PAY_RECEIPT,
      0,
      0,
    ];
    const restaurantData = [
      "Nhà hàng",
      feeSettings[0].PercentFeeMerchant,
      feeSettings[0].MAX_DAY_DELAY_PAY_RECEIPT,
      0,
      0,
    ];

    receipts.forEach((receipt: any) => {
      if (parseInt(receipt.Payer.Role) == 1) {
        shipperData[3] += receipt.FeeTotal;
        if (receipt.Status !== 1) {
          shipperData[4] += receipt.FeeTotal;
        }
      } else if (parseInt(receipt.Payer.Role) == 2) {
        restaurantData[3] += receipt.FeeTotal;
        if (receipt.Status !== 1) {
          restaurantData[4] += receipt.FeeTotal;
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
          orderStatus,
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

export async function getSetting(req, res) {
  try {
    const setting = await Setting.find({})
      .select("PercentFeeShipper PercentFeeMerchant MAX_DAY_DELAY_PAY_RECEIPT")
      .exec();
    if (!setting) {
      return res.send(
        nomalizeResponse(null, Constants.SERVER.GET_SETTING_ERROR)
      );
    }
    res.send(nomalizeResponse(setting[0]));
  } catch (error) {
    console.error(`[ERROR]: get setting error ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_SETTING_ERROR));
  }
}

export async function updateSetting(req, res) {
  const {
    shipperPercent: PercentFeeShipper,
    merchantPercent: PercentFeeMerchant,
    delayDay: MAX_DAY_DELAY_PAY_RECEIPT,
    id,
  } = req.body;
  try {
    const updatedSetting = await Setting.findByIdAndUpdate(id, {
      MAX_DAY_DELAY_PAY_RECEIPT,
      PercentFeeMerchant,
      PercentFeeShipper,
    }).exec();
    if (!updatedSetting) {
      return res.send(
        nomalizeResponse(null, Constants.SERVER.UPDATE_SETTING_ERROR)
      );
    }
    res.send(nomalizeResponse(null));
  } catch (error) {
    console.error(`[ERROR]: get setting error ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.UPDATE_SETTING_ERROR));
  }
}
