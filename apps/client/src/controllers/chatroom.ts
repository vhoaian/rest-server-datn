import { ChatMessage, ChatRoom } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";

export async function getChatRooms(req, res) {
  const { page, perpage } = req.query;
  const query: any = { User: req.user.id };

  const count = await ChatRoom.countDocuments(query);
  const orders = await ChatRoom.find(query)
    .select("-User")
    .populate("Shipper", "FullName Avatar")
    .populate("LastMessage", "Content Sender")
    .skip((page - 1) * perpage)
    .limit(perpage)
    .sort({ UpdatedAt: -1 })
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

export async function getChatMessages(req, res) {
  const { page, perpage } = req.query;
  const { id } = req.params;
  const query: any = { ChatRoom: id };

  const chatroom = await ChatRoom.findOne({
    _id: id,
    User: req.user.id,
  })
    .populate("Shipper", "FullName Avatar")
    .populate("LastMessage", "Content Sender")
    .exec();

  if (!chatroom) return res.send(nomalizeResponse(null, 2)); // khong ton tai

  const count = await ChatMessage.countDocuments(query);
  const messages = await ChatMessage.find(query)
    .select("-UpdatedAt -ChatRoom")
    .skip((page - 1) * perpage)
    .limit(perpage)
    .sort({ CreatedAt: -1 })
    .exec();

  res.send(
    nomalizeResponse(
      messages.map((o) => {
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
