import { RestaurantReview } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";

export async function getRestaurantReviews(req, res) {
  const { page, perpage, point, image } = req.query;
  const query: any = { Restaurant: req.data.restaurant };
  if (point?.length > 0) query.Point = { $in: point };
  if (typeof image == "boolean") {
    if (image) query["Images.0"] = { $exists: true };
    else query["Images.0"] = { $exists: false };
  }

  const count = await RestaurantReview.countDocuments(query);
  const orders = await RestaurantReview.find(query)
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
