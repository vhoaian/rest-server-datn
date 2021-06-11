import { Order, User } from "@vohoaian/datn-models";

const STATUS_BOOM = 9;
const handleBoom = async (orderID: string) => {
  const order = await Order.findById(orderID);
  if (!order) return;

  const user = await User.findById(order.User);
  if (!user) return;

  user.Status = -1;
  order.Status = STATUS_BOOM;
  await Promise.all([user.save(), order.save()]);
};
