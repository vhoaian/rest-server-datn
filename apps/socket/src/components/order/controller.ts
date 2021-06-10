import service from "./service";
import ZaloPay from "../../payment/ZaloPay";
import orderController from "../../socket/controller/order";
import { ZaloTransaction } from "@vohoaian/datn-models";
import mongoose from "mongoose";

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

  try {
    const { data: dataStr, mac } = req.body;
    const result = ZaloPay.VerifyCallback(dataStr, mac);

    if (result.return_code !== -1) {
      const { app_trans_id, embed_data, zp_trans_id, amount } = JSON.parse(
        dataStr
      );
      const { orderID, tool, description } = JSON.parse(embed_data);

      orderController.clearSelfDestructOrder(orderID);

      const newZaloPayTransaction = new ZaloTransaction({
        Description: description,
        TransID: zp_trans_id,
        Amount: amount,
        IsRefund: false,
        Order: mongoose.Types.ObjectId(orderID),
      });

      await newZaloPayTransaction.save();

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
  } catch (e) {
    res.send("ERROR");
  }
};
