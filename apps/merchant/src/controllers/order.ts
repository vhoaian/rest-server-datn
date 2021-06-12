import { Order } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";

export async function getOrders(req, res) {
  const { page, perpage, status } = req.query;
  const query: any = { Restaurant: req.data.restaurant };
  if (status?.length > 0) query.Status = { $in: status };

  const count = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .select(
      "-PromoCodes -Distance -Coor -Tool -User -Foods -UpdatedAt -Shipper -Restaurant"
    )
    .skip((page - 1) * perpage)
    .limit(perpage)
    .exec();

  res.send(
    nomalizeResponse(
      orders.map((o) => {
        const t = o.toObject();
        t.id = t._id;
        delete t._id;
        return t;
      }),
      0,
      {
        totalPage: Math.ceil(count / perpage),
        currentPage: page,
        perPage: perpage,
        total: count,
      }
    )
  );
}

export async function getOrder(req, res) {
  const { id } = req.params;
  const order = await Order.findOne({
    Restaurant: req.data.restaurant,
    _id: id,
  })
    .populate("Foods.Food", "Name Avatar Options")
    .select("-Distance -Coor -Tool -User -UpdatedAt -Restaurant")
    .exec();

  if (!order) return res.send(nomalizeResponse(null, 2));

  const response = order.toObject();
  for (let i = 0; i < response.Foods.length; i++) {
    const food = response.Foods[i];
    for (let j = 0; j < food.Options.length; j++) {
      const option = food.Options[j];
      const foundOption = (food.Food as any).Options.find(
        (o) => o.id == option.id
      );
      (option as any).Name = foundOption?.Name;
      for (let k = 0; k < option.Items.length; k++) {
        const item = option.Items[k];
        (item as any).Name = foundOption?.Items.find(
          (i) => i.id == item.id
        )?.Name;
      }
    }
    delete (food.Food as any).Options;
    (food.Food as any).id = (food.Food as any)._id;
    delete (food.Food as any)._id;
  }
  response.id = response._id;
  delete response._id;

  res.send(nomalizeResponse(response));
}
