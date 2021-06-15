import { Restaurant, Withdraw } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";

export async function getWithdraws(req, res) {
  const { page, perpage, status } = req.query;
  const query: any = { "User.Id": req.data.restaurant };
  if (status?.length > 0) query.Status = { $in: status };

  const count = await Withdraw.countDocuments(query);
  const orders = await Withdraw.find(query)
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

export async function addWithdraw(req, res) {
  const { amount } = req.body;
  const restaurant = await Restaurant.findById(req.data.restaurant);
  if (!((restaurant?.Wallet as number) >= amount))
    return res.send(nomalizeResponse(null, 3)); // khong du tien trong tai khoan
  const newWithdraw = await Withdraw.create({
    User: {
      Id: req.user.id,
      Role: 2,
    },
    Amount: amount,
  });

  // cap nhat so du
  (restaurant as any).Wallet = (restaurant?.Wallet as number) - amount;
  restaurant?.save();

  const response = newWithdraw.toObject();
  response.id = response._id;
  delete response._id;
  res.send(nomalizeResponse(response));
}
