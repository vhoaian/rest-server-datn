import {
  City,
  DeliveryAddress,
  Food,
  Order,
  User,
} from '@vohoaian/datn-models';
import { nomalizeResponse } from '../utils/normalize';
import { withFilter } from '../utils/objects';

// const DAFilter = withFilter('FullAddress Phone Geolocation id');
export async function addOrder(req, res) {
  const {
    foods,
    subtotal,
    deliveryaddress,
    shippingfee,
    promocodes,
    method,
    note,
    address,
    longitude,
    latitude,
  } = req.body;
  let { phone } = req.body;
  if (foods.length == 0) return res.send(nomalizeResponse(null, 2)); // Danh sách rỗng

  const fids = foods.map((f) => f.id);
  const foundFoods = await Food.find({ _id: { $in: fids } }).exec();
  if (fids.length != foundFoods.length)
    return res.send(nomalizeResponse(null, 3)); // Không tìm thấy một số sản phẩm

  const restaurant = ((
    await Food.findById(fids[0])
      .populate({
        path: 'FoodCategory',
        select: 'Restaurant',
        populate: {
          path: 'Restaurant',
        },
      })
      .exec()
  )?.FoodCategory as any).Restaurant;

  let delivery: any = null;
  let addr = address;

  if (deliveryaddress) {
    delivery = await DeliveryAddress.findById(deliveryaddress)
      .populate({
        path: 'User',
      })
      .exec();

    if (!delivery) return res.send(nomalizeResponse(null, 12)); // Không tìm thấy địa chỉ
    addr = delivery.FullAddress;

    if (!phone) {
      phone = delivery.Phone;
    }
  }

  let calsubtotal = 0;

  const defaultOrder = foundFoods.map((food) => ({
    // TODO
    Price: food.OriginalPrice,
    Options: food.Options.filter((option) => option.IsMandatory).map(
      (option) => ({
        id: (option as any)._doc.id,
        Items: option.Items.filter((item) => item.IsDefault).map((item) => ({
          id: (item as any)._doc.id,
          Quantity: 1,
          // TODO
          Price: item.OriginalPrice,
        })),
      })
    ),
  }));

  const userOrder = foods.map((food) => ({
    Food: food.id,
    Price: food.price,
    Quantity: food.quantity,
    Options: food.options?.map((option) => ({
      id: option.id,
      Items: option.items?.map((item) => ({
        id: item.id,
        Quantity: item.quantity,
        Price: item.price,
      })),
    })),
  }));

  // kiem tra userOrder
  for (let i = 0; i < userOrder.length; i++) {
    for (let j = 0; j < foundFoods.length; j++) {
      if (userOrder[i].Food == foundFoods[j].id) {
        // cung mot mon an
        // TO DO
        if (userOrder[i].Price != foundFoods[j].OriginalPrice)
          return res.send(nomalizeResponse(null, 4)); // Sai giá

        if (userOrder[i].Options?.length > 0) {
          for (let k = 0; k < userOrder[i].Options.length; k++) {
            const opt = userOrder[i].Options[k];
            for (let l = 0; l < foundFoods[j].Options.length; l++) {
              const opt2 = foundFoods[j].Options[l];
              if (opt.id == (opt2 as any)._doc.id) {
                if (opt.Items) {
                  if (opt.Items.length > opt2.MaxSelect) {
                    return res.send(nomalizeResponse(null, 7)); // một số lựa chọn chọn quá số lượng items cho phép
                  } else if (opt.Items.length == 0) {
                    return res.send(nomalizeResponse(null, 8)); // một số lựa chọn không có item nào bên trong mảng items
                  } else {
                    for (let m = 0; m < opt.Items.length; m++) {
                      const item = opt.Items[m];
                      for (let n = 0; n < opt2.Items.length; n++) {
                        const item2 = opt2.Items[n];
                        if (item.id == (item2 as any)._doc.id) {
                          if (!(item.Quantity <= item2.MaxQuantity)) {
                            return res.send(nomalizeResponse(null, 10)); // một số item chọn quá số lượng cho phép
                          }
                          // TODO
                          if (!(item.Price == item2.OriginalPrice)) {
                            return res.send(nomalizeResponse(null, 11)); // một số items sai giá
                          }
                          break;
                        }
                        if (n == opt2.Items.length - 1)
                          return res.send(nomalizeResponse(null, 9)); // một số items không tồn tại
                      }
                    }
                  }
                } else {
                  return res.send(nomalizeResponse(null, 6)); // một số lựa chọn không được chọn lựa
                }
                break;
              }
              if (l == foundFoods[j].Options.length - 1)
                return res.send(nomalizeResponse(null, 5)); // một số lựa chọn không tồn tại
            }
          }
        }

        if (!userOrder[i].Options) {
          userOrder[i].Options = defaultOrder[j].Options;
        } else {
          const temp = [...userOrder[i].Options];
          for (let k = 0; k < defaultOrder[j].Options.length; k++) {
            for (let l = 0; l < userOrder[i].Options.length; l++) {
              if (defaultOrder[j].Options[k].id == userOrder[i].Options[l].id)
                break;
              if (l == userOrder[i].Options.length - 1)
                temp.push(defaultOrder[j].Options[k]);
            }
          }
          userOrder[i].Options = temp;
        }

        calsubtotal += userOrder[i].Price * (userOrder[i].Quantity ?? 1);
        for (let k = 0; k < userOrder[j].Options.length; k++) {
          for (let l = 0; l < userOrder[i].Options[k].Items.length; l++) {
            const item = userOrder[i].Options[k].Items[l];
            calsubtotal += (item.Quantity ?? 1) * item.Price;
          }
        }
      }
    }
  }

  if (subtotal != calsubtotal) {
    return res.send(nomalizeResponse(null, 14)); // Tổng tiền sai
  }

  const calshippingfee = await calculateShippingFee();
  if (calshippingfee != shippingfee) {
    return res.send(nomalizeResponse(null, 13)); // Phí ship sai
  }

  // Xử lý payment method

  // Xử lý distance

  // Thêm vào CSDL
  const newOrder = await Order.create({
    ShippingFee: shippingfee,
    Subtotal: subtotal,
    Total: shippingfee + subtotal,
    // TODO
    Distance: 0,
    Address: addr,
    Coor: {
      longitude: delivery?.Geolocation?.longitude ?? longitude,
      latitude: delivery?.Geolocation?.latitude ?? latitude,
    },
    PaymentMethod: method,
    Note: note,
    Tool: restaurant.IsPartner,
    Foods: userOrder,
    User: req.user.id,
    Restaurant: restaurant.id,
    // PromoCode: Types.ObjectId[] | IPromoCodeDocument[];
    DeliveryAddress: deliveryaddress,
    Status: 0,
    Phone: phone,
  });

  const response = newOrder.toObject();
  response.id = response._id;
  delete response._id;
  res.send(nomalizeResponse(response));
}

export async function getOrders(req, res) {
  const orders = await Order.find({ User: req.user.id })
    .select('-PromoCodes -Distance -Coor -Tool -User -Foods -UpdatedAt')
    .exec();

  res.send(
    nomalizeResponse(
      orders.map((o) => {
        const t = o.toObject();
        t.id = t._id;
        delete t._id;
        return t;
      })
    )
  );
}

export async function getOrder(req, res) {
  const { id } = req.params;
  const order = await Order.findOne({
    User: req.user.id,
    _id: id,
  })
    .select('-Distance -Coor -Tool -User -UpdatedAt')
    .exec();

  if (!order) return res.send(nomalizeResponse(null, 2));

  const response = order.toObject();
  response.id = response._id;
  delete response._id;

  res.send(nomalizeResponse(order));
}

export async function calculateShippingFee() {
  return 10000;
}

export async function getShippingFee(req, res) {
  const { alongitude, alatitude, deliveryaddress, restaurant } = req.body;
  res.send(nomalizeResponse(await calculateShippingFee()));
}
