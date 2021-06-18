import {
  DeliveryAddress,
  Food,
  Order,
  Restaurant,
  Setting,
} from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";
import axios from "axios";
import { environment } from "../environments/base";
import ggAPI from "@rest-servers/google-api";

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
  const _foundFoods = (
    await Food.find({ _id: { $in: fids }, Status: { $gte: 0 } }).exec()
  ).map((x) => x.toObject());
  const foundFoods: any[] = [];
  for (let i = 0; i < fids.length; i++) {
    const found = _foundFoods.find((f) => f._id.equals(fids[i]));
    if (found) foundFoods.push(found);
  }
  if (fids.length != foundFoods.length)
    return res.send(nomalizeResponse(null, 3)); // Không tìm thấy một số sản phẩm

  const restaurant = ((
    await Food.findById(fids[0])
      .populate({
        path: "FoodCategory",
        select: "Restaurant",
        populate: {
          path: "Restaurant",
        },
      })
      .exec()
  )?.FoodCategory as any).Restaurant;
  if (restaurant.Status < 0 || (await restaurant.isOpening()) === false)
    return res.send(nomalizeResponse(null, 15)); // Nhà hàng không phục vụ

  let delivery: any = null;
  let addr = address;

  if (deliveryaddress) {
    delivery = await DeliveryAddress.findById(deliveryaddress)
      .populate({
        path: "User",
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
        id: option.id,
        Items: option.Items.filter((item) => item.IsDefault).map((item) => ({
          id: item.id,
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
    // TO DO
    if (userOrder[i].Price != foundFoods[i].OriginalPrice)
      return res.send(nomalizeResponse(null, 4)); // Sai giá

    if (userOrder[i].Options?.length > 0) {
      for (let k = 0; k < userOrder[i].Options.length; k++) {
        const opt = userOrder[i].Options[k];
        for (let l = 0; l < foundFoods[i].Options.length; l++) {
          const opt2 = foundFoods[i].Options[l];
          if (opt.id == opt2.id) {
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
                    if (item.id == item2.id) {
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
          if (l == foundFoods[i].Options.length - 1)
            return res.send(nomalizeResponse(null, 5)); // một số lựa chọn không tồn tại
        }
      }
    }

    if (!userOrder[i].Options) {
      userOrder[i].Options = defaultOrder[i].Options;
    } else {
      const temp = [...userOrder[i].Options];
      for (let k = 0; k < defaultOrder[i].Options.length; k++) {
        for (let l = 0; l < userOrder[i].Options.length; l++) {
          if (defaultOrder[i].Options[k].id == userOrder[i].Options[l].id)
            break;
          if (l == userOrder[i].Options.length - 1)
            temp.push(defaultOrder[i].Options[k]);
        }
      }
      userOrder[i].Options = temp;
    }

    let foodPrice = userOrder[i].Price;
    for (let k = 0; k < userOrder[i].Options.length; k++) {
      for (let l = 0; l < userOrder[i].Options[k].Items.length; l++) {
        const item = userOrder[i].Options[k].Items[l];
        foodPrice += (item.Quantity ?? 1) * item.Price;
      }
    }
    calsubtotal += foodPrice * (userOrder[i].Quantity ?? 1);
  }

  if (subtotal != calsubtotal) {
    return res.send(nomalizeResponse(null, 14)); // Tổng tiền sai
  }

  const mapInfo = await ggAPI.calcDistance(restaurant.FullAddress, addr);
  const calshippingfee = await calculateShippingFee(mapInfo.distance / 1000);
  if (typeof calshippingfee != "number")
    return res.send(nomalizeResponse(null, 16)); // Vượt quá giới hạn kc giao hàng
  if (calshippingfee != shippingfee) {
    return res.send(nomalizeResponse(null, 13)); // Phí ship sai
  }

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

  const newOrderResponse = newOrder.toObject();
  (newOrderResponse as any).Avatar = restaurant.Avatar;
  (newOrderResponse as any).Name = restaurant.Name;
  (newOrderResponse as any).FullAddress = restaurant.FullAddress;
  newOrderResponse.Foods.forEach((f, i) => {
    (f as any).Name = foundFoods[i].Name;
    (f as any).Avatar = foundFoods[i].Avatar;
    f.Options.forEach((o, j) => {
      const found = foundFoods[i].Options.find((x) => x.id == o.id);
      if (found) (o as any).Name = found.Name;
      o.Items.forEach((item, k) => {
        const found2 = found.Items.find((x) => x.id == item.id);
        if (found2) (item as any).Name = found2.Name;
      });
    });
  });

  // **** SOCKET SERVER **** \\ Notify for socket server \\ 0 - cash | 1 - zalopay
  type SOCKET_RETURN_TYPE = {
    success: boolean;
    message: string;
    paymentInfo: any;
  };

  const {
    data: responseData,
  }: {
    data: SOCKET_RETURN_TYPE;
  } = await axios.post(
    `${environment.URL_SOCKET_SERVER}/create-order`,
    { orderID: newOrder._id },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  // *********************** \\

  const response = newOrderResponse;
  response.id = response._id;
  delete response._id;

  res.send(
    nomalizeResponse({
      ...response,
      paymentInfo: responseData.paymentInfo,
      shippingInfo: {
        ...mapInfo,
        fee: calshippingfee,
        estimatedTTD: calculateTimeToDeliveryInMinute(mapInfo.duration),
      },
    })
  );
}

export async function getOrders(req, res) {
  const { page, perpage, status } = req.query;
  const query: any = { User: req.user.id };
  if (status?.length > 0) query.Status = { $in: status };

  const count = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .populate("Restaurant", "Name Avatar")
    .select(
      "-PromoCodes -Distance -Coor -Tool -User -Foods -UpdatedAt -Shipper"
    )
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

export async function getOrder(req, res) {
  const { id } = req.params;
  const order = await Order.findOne({
    User: req.user.id,
    _id: id,
  })
    .populate("Foods.Food", "Name Avatar Options")
    .populate("Restaurant", "Name Avatar")
    .populate("Shipper", "FullName Avatar")
    .select("-Coor -Tool -User")
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

export async function calculateShippingFee(distKm: number) {
  return (await Setting.getShippingFee(distKm))?.Fee;
}

export function calculateTimeToDeliveryInMinute(timeInSec: number) {
  return 15 + Math.ceil(timeInSec / 60);
}

export async function getShippingFee(req, res) {
  const { destination, deliveryaddress, restaurant } = req.query;
  let dest = destination;
  const rest = await Restaurant.findById(restaurant);
  if (!rest) return res.send(nomalizeResponse(null, 2));
  const origin = rest.FullAddress as string;
  if (deliveryaddress) {
    const d = await DeliveryAddress.findById(deliveryaddress);
    if (!d) return res.send(nomalizeResponse(null, 3));
    dest = d.FullAddress;
  }

  const data = await ggAPI.calcDistance(origin, dest);

  res.send(
    nomalizeResponse({
      ...data,
      fee: await calculateShippingFee(data.distance / 1000),
      estimatedTTD: calculateTimeToDeliveryInMinute(data.duration),
    })
  );
}
