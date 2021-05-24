import service from "./service";
import ZaloPay from "../../payment/ZaloPay";
import {
  changeStatusOrder,
  ORDER_STATUS,
} from "../../socket/eventListener/order";

export const getHomePage = (req, res) => {
  const title = "Well come to Socket server!!";
  res.send(title);
};

export const createOrder = async (req, res) => {
  const { orderID = "" } = req.body;
  const response = await service.createOrder(orderID);
  res.send("response");
};

export const cbZaloPay = async (req, res) => {
  console.log("||** ZALOPAY CALLBACK **||");

  const { data: dataStr, mac } = req.body;
  const result = ZaloPay.VerifyCallback(dataStr, mac);

  if (result.return_code !== -1) {
    const { app_trans_id, embed_data } = JSON.parse(dataStr);
    const { orderID } = JSON.parse(embed_data);

    // invoke for client about status order
    // .. do something ..
    changeStatusOrder(orderID, "system_admin", ORDER_STATUS.WAITING);
  }

  res.send(result);
};
