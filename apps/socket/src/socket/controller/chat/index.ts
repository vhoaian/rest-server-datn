class ChatController {
  constructor() {}
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
