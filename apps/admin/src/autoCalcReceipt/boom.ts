import { Order, User } from "@vohoaian/datn-models";
import { Constants } from "../environments/base";

const STATUS_BOOM = 9;
const handleBoom = async (orderID: string) => {
  const order = await Order.findById(orderID);
  if (!order) return;

  const user = await User.findById(order.User);
  if (!user) return;

  user.Status = Constants.STATUS_ACCOUNT.LOCK;
  order.Status = STATUS_BOOM;
  await Promise.all([user.save(), order.save()]);
};
