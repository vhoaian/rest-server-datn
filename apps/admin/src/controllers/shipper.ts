import { nomalizeResponse } from "../utils/normalize";
import { Order, Receipt, Shipper } from "@vohoaian/datn-models";
import { Constants } from "../environments/base";
import ReceiptModel from "@vohoaian/datn-models/lib/models/Receipt";
import mailController from "../mail/mailController";

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
      .select(
        "Phone Email Rating Status CreatedAt FullName Avatar History Gender Wallet"
      )
      .limit(Constants.PAGENATION.PER_PAGE)
      .skip((page - 1) * Constants.PAGENATION.PER_PAGE)
      .exec();
    //sort by point
    shippers = shippers.sort((a, b) => {
      return b.Point - a.Point;
    });
    const receiptFee: any = await Promise.all(
      shippers.map((shipper: any) => {
        return Receipt.findOne({
          "Payer.Id": shipper._id,
          "Payer.Role": 1,
        }).exec();
      })
    );

    shippers = shippers.map((user: any, i) => {
      const serviceCharge = receiptFee[i] ? receiptFee[i].Status : 0;
      const receiptID = receiptFee[i] ? receiptFee[i]._id : "";
      const serviceFee = receiptFee[i] ? receiptFee[i].FeeTotal : 0;
      return {
        _id: user._id,
        phone: user.Phone,
        email: user.Email,
        fullname: user.FullName,
        gender: user.Gender,
        wallet: user.Wallet,
        avatar: user.Avatar,
        history: user.History,
        rating: user.Rating,
        status: user.Status,
        createdAt: user.CreatedAt,
        serviceCharge,
        serviceFee,
        receiptID,
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
      return res.send(
        nomalizeResponse(null, Constants.SERVER.CREATE_SHIPPER_ERROR)
      );
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
    if (!receipt)
      throw new Error(`paid receipt ${id} fail, receipt does not exist`);

    const shipper = await Shipper.findById(receipt.Payer.Id);
    if (!shipper)
      throw new Error(`paid receipt ${id} fail, shipper does not exist`);

    receipt.Status = Constants.PAID.RESOLVE;
    shipper.Status = Constants.STATUS_ACCOUNT.UNLOCK;
    await Promise.all([receipt.save(), shipper.save()]);

    console.log(`[SHIPPER]: paid receipt ${id} success.`);
    res.send(nomalizeResponse(null, 0));
  } catch (e) {
    console.log(`[SHIPPER]: ${e.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.PAY_RECEIPT_ERROR));
  }
};

export async function blockShipperById(req, res) {
  const { id, reason } = req.body;
  const { shipper } = req.data;
  try {
    const update = { Status: Constants.STATUS.NORMAL };

    if (shipper.Status === Constants.STATUS.UNCHECK) {
      return res.send(
        nomalizeResponse(null, Constants.SERVER.CAN_NOT_FIND_USER)
      );
    }
    shipper.Status === Constants.STATUS.NORMAL
      ? (update.Status = Constants.STATUS.BLOCK)
      : update.Status === Constants.STATUS.NORMAL;
    if (
      update.Status === Constants.STATUS.BLOCK &&
      typeof shipper.Email !== "undefined"
    ) {
      await mailController.sendMailLockAccountWithMessage(
        shipper.FullName,
        shipper.Email,
        `Tài khoản bạn tạm thời bị khóa với lý do: ${reason}`,
        "vn"
      );
    }
    const result = await Shipper.findByIdAndUpdate({ _id: id }, update, {
      new: true,
    }).exec();

    res.send(nomalizeResponse(result, 0));
  } catch (error) {
    console.log(`[ERROR]: block shipper: ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.BLOCK_USER_ERROR));
  }
}

export async function updateBoomOrderByID(req, res) {
  const { id } = req.params;
  const { order } = req.data;

  try {
    //check of this order is delivered bys this shipper
    if (order.Shipper && !order.Shipper.equals(id)) {
      return res.send(
        nomalizeResponse(null, Constants.SERVER.CAN_NOT_FIND_ORDER)
      );
    }
    //updae status of Order
    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: order._id },
      { Status: Constants.ORDER_STATUS.BOOM }
    ).exec();
    if (!updatedOrder) {
      return res.send(
        nomalizeResponse(null, Constants.SERVER.CAN_NOT_FIND_ORDER)
      );
    }
    const shipper = await Shipper.findById(id).exec();
    if (shipper) {
      shipper.History.Cancel += 1;
      await shipper.save();
    }

    res.send(nomalizeResponse(null));
  } catch (error) {
    console.error(`[ERROR]: boom order shipper: ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.UPDATE_ORDER_ERROR));
  }
}
