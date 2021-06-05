export const hookUpdateComplaint = async (req, res) => {
  const { reason, email, images, phoneNumber, fullName, orderID } = req.body;
  res.send(req.body);
};

// Complaint
// |- Email: string
// |- FullName: string
// |- PhoneNumber: string
// |- Reason: string
// |- OrderID: ObjectID - link to Order Collection
// |- Images: Array<string>
// |- Status: [0: not resolve, 1: resolved]
// |- CreatedAt: Date | default: new Date()

export default {
  hookUpdateComplaint,
};
