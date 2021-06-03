import { ChatRoom, ChatMessage, Shipper, User } from "@vohoaian/datn-models";
import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import { Types } from "mongoose";
import { TAG_EVENT } from "../../TAG_EVENT";

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

  public async createRoom(
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

      return `${_room._id}`;
    } catch (e) {
      console.log(`[${this._TAG_LOG_FAIL}]: ${e.message}`);
      return null;
    }
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
