import { ChatRoom, ChatMessage, Shipper, User } from "@vohoaian/datn-models";
import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import { Types } from "mongoose";
import { TAG_EVENT } from "../../TAG_EVENT";
import customerController from "../customer/customerController";
import shipperController from "../shipper/shipperController";

class ChatController {
  private _TAG_LOG = "CHAT_CONTROLLER";
  private _TAG_LOG_FAIL = "CHAT_CONTROLLER_FAIL";
  private _ROLE_SENDER = ["customer", "shipper"];

  private _io: any = null;

  constructor() {}

  private getSocket(roomID: string): any {
    return this._io.to(roomID);
  }

  public setIO(io) {
    this._io = io;
  }

  public async reconnectChat(shipperID: string, customerID: string) {
    const _room = await ChatRoom.findOne({
      Shipper: Types.ObjectId(shipperID),
      User: Types.ObjectId(customerID),
    });
    if (!_room)
      return console.log(
        `[${this._TAG_LOG_FAIL}]: reconnect room fail, room does not exist`
      );

    shipperController.getSocket(shipperID)?.join(`${_room._id}`);
    customerController.getSocket(customerID)?.join(`${_room._id}`);

    console.log(`[${this._TAG_LOG}]: reconnect room success`);
  }

  public async openRoom(
    shipperID: string,
    customerID: string
  ): Promise<string | null> {
    try {
      let _room = await ChatRoom.findOne({
        Shipper: Types.ObjectId(shipperID),
        User: Types.ObjectId(customerID),
      });

      const _shipper = await Shipper.findOne({
        _id: Types.ObjectId(shipperID),
      }).select("-_id FullName Avatar Phone");

      if (!_room) {
        _room = new ChatRoom({
          Shipper: Types.ObjectId(shipperID),
          User: Types.ObjectId(customerID),
        });
        await _room.save();

        const _autoMessage = `${_shipper?.FullName} đang trên đường giao hàng cho quý khách. Xin vui lòng giữ điện thoại để được cập nhật tình hình đơn hàng nếu có thay đổi. Cảm ơn quý khách.`;
        this.sendMessage(`${_room._id}`, "shipper", _autoMessage);
      }

      shipperController.getSocket(`${Shipper}`)?.join(`${_room._id}`);
      customerController.getSocket(`${User}`)?.join(`${_room._id}`);

      return `${_room._id}`;
    } catch (e) {
      console.log(`[${this._TAG_LOG_FAIL}]: ${e.message}`);
      return null;
    }
  }

  public async closeRoom(roomID: string) {
    const _room = await ChatRoom.findOne({ _id: Types.ObjectId(roomID) });

    if (!_room)
      return console.log(
        `[${this._TAG_LOG_FAIL}]: close room fail, room does not exist`
      );

    const { Shipper, User } = _room;

    shipperController.getSocket(`${Shipper}`)?.leave(roomID);
    customerController.getSocket(`${User}`)?.leave(roomID);
  }

  public async sendMessage(
    roomID: string,
    sender: "customer" | "shipper",
    message: string
  ): Promise<boolean> {
    try {
      const _room = await ChatRoom.findOne({ _id: Types.ObjectId(roomID) })
        .populate("Shipper", "Avatar FullName")
        .populate("User", "Avatar FullName");

      if (!_room) {
        console.log(
          `[${this._TAG_LOG_FAIL}]: Send message fail, room does not exist.`
        );
        return false;
      }

      const _newMessage = new ChatMessage({
        ChatRoom: Types.ObjectId(roomID),
        Content: message,
        Sender: this._ROLE_SENDER.indexOf(sender),
      });
      await _newMessage.save();

      _room.LastMessage = _newMessage._id;
      _room.UpdatedAt = new Date();
      _room.TotalChat = _room.TotalChat + 1;
      _room.save();

      const info = [_room.Shipper, _room.User];

      this.getSocket(roomID).emit(
        TAG_EVENT.RESPONSE_CHAT,
        normalizeResponse("New message", {
          roomID,
          message,
          sender: info[this._ROLE_SENDER.indexOf(sender)],
          receiver: info[1 - this._ROLE_SENDER.indexOf(sender)],
          roleReceiver: sender,
        })
      );

      console.log(`[${this._TAG_LOG}]: send message success`);

      return true;
    } catch (e) {
      console.log(`[${this._TAG_LOG_FAIL}]: ${e.message}`);
      return false;
    }
  }

  public async getListMessage(
    roomID: string,
    role: "customer" | "shipper",
    limit: number
  ): Promise<void> {
    const _room = await ChatRoom.findOne({ _id: Types.ObjectId(roomID) })
      .populate("Shipper", "Avatar FullName")
      .populate("User", "Avatar FullName");

    if (!_room) {
      console.log(
        `[${this._TAG_LOG_FAIL}]: Get list message fail, room does not exist.`
      );
      return;
    }

    const _listMessage = await ChatMessage.find({
      ChatRoom: Types.ObjectId(roomID),
    })
      .sort([["CreatedAt", -1]])
      .limit(limit);

    const sender = _room[`${role === "customer" ? "User" : "Shipper"}`];
    const receiver = _room[`${role === "customer" ? "Shipper" : "User"}`];

    const listMessage: Array<{
      message: string;
      nameSender: string;
      nameReceiver: string;
      avatarReceiver: string;
      time: Date;
    }> = _listMessage.map((mess) => ({
      message: mess.Content,
      nameSender: sender.FullName,
      nameReceiver: receiver.FullName,
      avatarReceiver: receiver.Avatar,
      time: mess.CreatedAt,
    }));

    if (role === "customer") {
      customerController.getSocket(`${sender._id}`).emit(
        TAG_EVENT.RESPONSE_GET_LIST_MESSAGE_CHAT,
        normalizeResponse("Get list messgae chat", {
          roomID,
          listMessage,
        })
      );
      return;
    }

    if (role === "shipper") {
      shipperController.getSocket(`${sender._id}`).emit(
        TAG_EVENT.RESPONSE_GET_LIST_MESSAGE_CHAT,
        normalizeResponse("Get list messgae chat", {
          listMessage,
        })
      );
      return;
    }
  }
}

const chatController = new ChatController();
export default chatController;

// Model Room Chat
// Description: Khi 2 người chat với nhau thì mình sẽ tiến hành tạo 1 phòng riêng, nếu chưa có thì tiến hành tạo phòng.
//              Thường thì chúng ta sẽ tạo phòng sẵn mỗi khi khách hàng đặt món - Tạo phòng cho cả shipper và customer.
//
// |- id: ObjectID
// |- totalChat: number
// |- shipper: ObjectID
// |- customer: ObjectID
// |- lastMessage: ObjectID - trỏ tới tin nhắn cuối cùng.

// Model Message
// Description: Mô tả tin nhắn giữa 2 người.
//
// |- id: ObjectID
// |- room: ObjectID - trỏ tới RoomChat
// |- message: string
// |- sender: ObjectID
// |- reciever: ObjectID
// |- timeCreate: Date
