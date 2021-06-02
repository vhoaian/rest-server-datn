import service from "./service";
import ZaloPay from "../../payment/ZaloPay";
import orderController from "../../socket/controller/order";

export const getHomePage = (req, res) => {
  const title = "Well come to Socket server!!";
  res.send(title);
};

export const createOrder = async (req, res) => {
  const { orderID = "" } = req.body;
  const response = await service.createOrder(orderID);
  res.send(response);
};

export const cbZaloPay = async (req, res) => {
  console.log("||** ZALOPAY CALLBACK **||");

  const { data: dataStr, mac } = req.body;
  const result = ZaloPay.VerifyCallback(dataStr, mac);

  if (result.return_code !== -1) {
    const { app_trans_id, embed_data } = JSON.parse(dataStr);
    const { orderID, tool } = JSON.parse(embed_data);

    // invoke for client about status order
    // .. do something ..
    if (tool) {
      orderController.changeStatusOrder(
        orderID,
        "system_admin",
        orderController.ORDER_STATUS.WAITING
      );
    } else {
      orderController.changeStatusOrder(
        orderID,
        "system_admin",
        orderController.ORDER_STATUS.MERCHANT_CONFIRM
      );
    }
  }

  res.send(result);
};
