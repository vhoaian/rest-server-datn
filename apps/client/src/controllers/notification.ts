import { Notification } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";

export async function getNotifications(req, res) {
  const { page, perpage } = req.query;
  const query: any = { "Receiver.Id": req.data.restaurant };

  const count = await Notification.countDocuments(query);
  const orders = await Notification.find(query)
    // .select(
    //   "-PromoCodes -Distance -Coor -Tool -User -Foods -UpdatedAt -Shipper -Restaurant"
    // )
    .skip((page - 1) * perpage)
    .limit(perpage)
    .sort({ CreatedAt: -1 })
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
