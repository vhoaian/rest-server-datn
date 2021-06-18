import { ChatRoom, ChatMessage, Shipper, User } from "@vohoaian/datn-models";
import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import { Types } from "mongoose";
import { TAG_EVENT } from "../../TAG_EVENT";
import customerController from "../customer/customerController";
import shipperController from "../shipper/shipperController";

class ChatController {
  private _TAG_LOG = "CHAT_CONTROLLER";
  private _TAG_LOG_FAIL = "CHAT_CONTROLLER_FAIL";
  private _ROLE_SENDER = ["customer", "shipper", "system"];

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
      }

      const _autoMessage = `${_shipper?.FullName} đang trên đường giao hàng cho quý khách. Xin vui lòng giữ điện thoại để được cập nhật tình hình đơn hàng nếu có thay đổi. Cảm ơn quý khách.`;
      this.sendMessage(`${_room._id}`, "system", _autoMessage);

      shipperController.getSocket(shipperID)?.join(`${_room._id}`);
      customerController.getSocket(customerID)?.join(`${_room._id}`);

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
    sender: "customer" | "shipper" | "system",
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
        Sender: sender === "customer" ? 0 : 1,
      });
      await _newMessage.save();

      _room.LastMessage = _newMessage._id;
      _room.UpdatedAt = new Date();
      _room.TotalChat = _room.TotalChat + 1;
      _room.save();

      this.getSocket(roomID).emit(
        TAG_EVENT.RESPONSE_CHAT,
        normalizeResponse("New message", {
          roomID,
          message,
          shipper: _room.Shipper,
          customer: _room.User,
          roleSender: sender,
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
