import orderController from "../../socket/controller/order";
import ZaloPay from "../../payment/ZaloPay";
import { Order } from "@vohoaian/datn-models";

const service = {
  async createOrder(
    orderID: string
  ): Promise<{ success: boolean; message: string; paymentInfo: any }> {
    console.log("HOOK CREATE ORDER");

    let paymentInfo: any = null;
    let success: boolean = false;
    if (orderID) {
      success = await orderController.addOrder(orderID);

      const orderDB: any = await Order.findOne({ _id: orderID });
      const order: any = orderDB.toObject();

      // paymentMethod : 0 - cash | 1 - zalopay
      const paymentMethods = ["cash", "zalopay"];
      if (paymentMethods[order.PaymentMethod] === "zalopay") {
        paymentInfo = await ZaloPay.CreateOrder({ order });
        console.log(paymentInfo);
      }
    }

    return {
      success,
      message: `Create order in Socket-Server ${success ? "success" : "fail"}`,
      paymentInfo,
    };
  },
};

export default service;
