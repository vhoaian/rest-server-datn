import * as orderController from "../../socket/eventListener/order";
import ZaloPay from "../../payment/ZaloPay";

const service = {
  async createOrder(
    orderID: string
  ): Promise<{ success: boolean; message: string; paymentInfo: any }> {
    let paymentInfo: any = null;
    let success: boolean = false;
    if (orderID) {
      success = await orderController.addOrder(orderID);

      // const order = await Order.findOne({});
      const order = { optionPayment: "zalopay" };

      if (order.optionPayment === "zalopay") {
        paymentInfo = await ZaloPay.CreateOrder({ orderID });
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
