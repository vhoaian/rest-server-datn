import { Complaint } from "@vohoaian/datn-models";
import mongoose from "mongoose";
import ggAPI from "@rest-servers/google-api";

export const hookUpdateComplaint = async (req, res) => {
  try {
    const { reason, email, images, phoneNumber, fullName, orderID } = req.body;

    const listImagesPublic: Array<string | null> = [];
    for (const img of images.split(", ")) {
      const { webContentLink } = await ggAPI.generatePublicUrl(
        ggAPI.getFileIDFromURL(img)
      );
      listImagesPublic.push(webContentLink);
    }

    const newComplaint = new Complaint({
      Email: email,
      FullName: fullName,
      PhoneNumber: phoneNumber,
      Reason: reason,
      OrderID: mongoose.Types.ObjectId(orderID),
      Images: listImagesPublic,
      Status: 0,
    });

    await newComplaint.save();

    res.send("OK");
  } catch (e) {
    res.send(e.message);
  }
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
