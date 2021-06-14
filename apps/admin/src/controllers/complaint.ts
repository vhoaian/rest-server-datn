import { Complaint } from "@vohoaian/datn-models";
import mongoose from "mongoose";
import ggAPI from "@rest-servers/google-api";
import { Constants } from "../environments/base";
import { nomalizeResponse } from "../utils/normalize";

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

const getComplaintList = async (req, res) => {
  const { page } = req.query;
  const option: any = {};
  try {
    const totalComplaints = await Complaint.countDocuments({
      Status: 0,
    }).exec();

    let complaints: Array<any> = await Complaint.find({})
      .select("Images Reason FullName PhoneNumber Status Email OrderID")
      .populate("OrderID")
      .limit(Constants.PAGENATION.PER_PAGE)
      .skip((page - 1) * Constants.PAGENATION.PER_PAGE)
      .exec();

    complaints = complaints.sort();

    console.log({ complaints });
    complaints = complaints.map((complaint: any) => {
      return {
        images: complaint.Images,
        reason: complaint.Reason,
        fullname: complaint.FullName,
        phoneNumber: complaint.PhoneNumber,
        status: complaint.Status,
        email: complaint.Email,
        _id: complaint._id,
        createdAt: complaint.OrderID.CreatedAt,
        payment: complaint.OrderID.Total,
      };
    });
    res.send(
      nomalizeResponse({ complaints, totalComplaints }, 0, {
        currentPage: page,
        totalPage: Math.ceil(totalComplaints / Constants.PAGENATION.PER_PAGE),
        perPage: Constants.PAGENATION.PER_PAGE,
      })
    );
  } catch (error) {
    console.log(`[ERROR]: get complaints ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_COMP_ERROR));
  }
};

export default {
  hookUpdateComplaint,
  getComplaintList,
};
