import { Complaint, Restaurant, Shipper, User } from "@vohoaian/datn-models";
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
    const totalComplaints = await Complaint.countDocuments({}).exec();

    let complaints: Array<any> = await Complaint.find({})
      .select(
        "Images Reason FullName PhoneNumber Status Email OrderID CreatedAt"
      )
      .populate("OrderID")
      .limit(Constants.PAGENATION.PER_PAGE)
      .skip((page - 1) * Constants.PAGENATION.PER_PAGE)
      .exec();

    complaints = complaints.sort((a, b) => {
      return a.Status - b.Status;
    });
    complaints = complaints.map((complaint: any) => {
      return {
        images: complaint.Images,
        reason: complaint.Reason,
        fullname: complaint.FullName,
        phoneNumber: complaint.PhoneNumber,
        status: complaint.Status,
        email: complaint.Email,
        _id: complaint._id,
        createdAt: complaint.CreatedAt,
        payment:
          complaint.OrderID.Total +
          complaint.OrderID.Total +
          (complaint.OrderID.SubTotal || 0),
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

async function getDetailCompliant(req, res) {
  const { id } = req.params;

  try {
    const complaint = await Complaint.findById({ _id: id })
      .populate("OrderID", "ShippingFee Total SubTotal User Restaurant Shipper")
      .exec();

    if (complaint) {
      const order = complaint.OrderID;

      const restaurant = await Restaurant.findById(order.Restaurant)
        .select("Name Phone")
        .exec();
      const shipper = await Shipper.findById(order.Shipper)
        .select("FullName Phone")
        .exec();
      const data = {
        total: order.ShippingFee + order.Total + (order.SubTotal || 0),
        images: complaint.Images,
        createAt: complaint.CreatedAt,
        reason: complaint.Reason,
        fullname: complaint.FullName,
        phoneNumber: complaint.PhoneNumber,
        status: complaint.Status,
        email: complaint.Email,
        _id: complaint._id,
        restaurant,
        shipper,
      };
      res.send(nomalizeResponse(data));
    } else {
      res.send(nomalizeResponse(null, Constants.SERVER.GET_COMP_ERROR));
    }
  } catch (error) {
    console.log(`[ERROR]: get details complaint ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_COMP_ERROR));
  }
}

async function solveComplaint(req, res) {
  const { id } = req.params;
  try {
    const result = await Complaint.findByIdAndUpdate(
      id,
      { Status: 1 },
      { new: true }
    ).exec();
    res.send(nomalizeResponse(result));
  } catch (error) {
    console.log(`[ERROR]: edit complaint ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.SOLVE_COMP_ERROR));
  }
}

export default {
  hookUpdateComplaint,
  getComplaintList,
  getDetailCompliant,
  solveComplaint,
};
