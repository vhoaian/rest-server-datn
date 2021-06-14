import { nomalizeResponse } from "../utils/normalize";
import { Receipt, Shipper } from "@vohoaian/datn-models";
import { Constants } from "../environments/base";
import ReceiptModel from "@vohoaian/datn-models/lib/models/Receipt";

export async function getShipperManagement(req, res) {
  const { page, email, phone } = req.query;
  const option: any = {};
  if (email !== "") {
    const regex = new RegExp(`^${email}.*`, "g");
    option.Email = regex;
  }
  if (phone !== "") {
    const regex = new RegExp(`^${phone}.*`, "g");
    option.Phone = regex;
  }
  try {
    const totalShipper = await Shipper.countDocuments(option).exec();

    let shippers: any = await Shipper.find(option)
      .select("Phone Email Point Status CreatedAt")
      .limit(Constants.PAGENATION.PER_PAGE)
      .skip((page - 1) * Constants.PAGENATION.PER_PAGE)
      .exec();
    //sort by point
    shippers = shippers.sort((a, b) => {
      return b.Point - a.Point;
    });
    const receiptFee: any = await Promise.all(
      shippers.map((shipper: any) => {
        return Receipt.find({
          ["Payer.Id"]: shipper._id,
          Role: 1,
        }).exec();
      })
    );

    shippers = shippers.map((user: any, i) => {
      return {
        _id: user._id,
        phone: user.Phone,
        email: user.Email,
        point: user.Point,
        status: user.Status,
        createdAt: user.createdAt,
        serviceCharge:
          receiptFee[i].Status === Constants.PAID.UNRESOLVE
            ? "Nợ phí"
            : "Đã thanh toán",
      };
    });

    res.send(
      nomalizeResponse({ totalShipper, shippers }, 0, {
        totalPage: Math.ceil(totalShipper / Constants.PAGENATION.PER_PAGE),
        currentPage: page,
        perPage: Constants.PAGENATION.PER_PAGE,
      })
    );
  } catch (error) {
    console.log(`[ERROR]: user management: ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_SHIPPER_ERROR));
  }
}

export const createShipper = async (req, res): Promise<void> => {
  const {
    phone: Phone,
    email: Email,
    fullName: FullName,
    gender: Gender,
  } = req.body;

  try {
    const oldShipper = await Shipper.findOne({
      $or: [
        {
          Phone,
        },
        {
          Email,
        },
      ],
    });

    if (oldShipper) {
      console.log(
        `[SHIPPER]: create new shipper fail, phone or email already exist. Phone & Email shipper: ${oldShipper.Phone} - ${oldShipper.Email}`
      );
      res.send(nomalizeResponse(null, Constants.SERVER.CREATE_SHIPPER_ERROR));
    }

    const newShipper = new Shipper({ Phone, Email, Gender, FullName });
    await newShipper.save();

    console.log("[SHIPPER]: Create new shipper success.");
    res.send(nomalizeResponse(null, 0));
  } catch (e) {
    console.log(`[SHIPPER]: Create new shipper fail, ${e.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.CREATE_SHIPPER_ERROR));
  }
};

export const payReceipt = async (req, res) => {
  const { id } = req.body;
  try {
    const receipt = await ReceiptModel.findById(id);
    if (!receipt) {
      console.log(
        `[SHIPPER]: paid receipt ${id} fail, receipt does not exist.`
      );
      return res.send(
        nomalizeResponse(null, Constants.SERVER.PAY_RECEIPT_ERROR)
      );
    }

    receipt.Status = Constants.PAID.RESOLVE;
    await receipt.save();

    console.log(`[SHIPPER]: paid receipt ${id} success.`);
    res.send(nomalizeResponse(null, 0));
  } catch (e) {
    console.log(`[SHIPPER]: ${e.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.PAY_RECEIPT_ERROR));
  }
};
