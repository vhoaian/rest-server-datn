import { Manager, Restaurant, Shipper } from "@vohoaian/datn-models";
import NotificationModel from "@vohoaian/datn-models/lib/models/Notification";
import Withdraw from "@vohoaian/datn-models/lib/models/Withdraw";
import environment, { Constants } from "../environments/base";
import { pushNotification } from "../notification";
import { nomalizeResponse } from "../utils/normalize";

export const getAllRequestWithdraw = async (req, res): Promise<void> => {
  try {
    const { page, phone } = req.query;
    const option: any = { Status: { $lt: Constants.PAID.RESOLVE } };
    const totalComplaints = await Withdraw.countDocuments(option);

    let withdraws: any = await Withdraw.find(option)
      .limit(Constants.PAGENATION.PER_PAGE)
      .skip((page - 1) * Constants.PAGENATION.PER_PAGE);

    await Promise.all(
      withdraws.reduce(
        (lsProms, curr) => lsProms.concat(mapInfoForWithdraw(curr)),
        []
      )
    );
    let listWithdraw = [];
    if (phone !== "") {
      listWithdraw = withdraws.filter((elm) =>
        elm.User.Phone.startsWith(phone)
      );
    } else {
      listWithdraw = withdraws;
    }

    res.send(
      nomalizeResponse({ listWithdraw }, 0, {
        currentPage: page,
        totalPage: Math.ceil(totalComplaints / Constants.PAGENATION.PER_PAGE),
        perPage: Constants.PAGENATION.PER_PAGE,
      })
    );
  } catch (e) {
    console.log(`[WITHDRAW]: get list withdraw fail, ${e.message}.`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_WITHDRAW_ERROR));
  }
};

export const handleWithdraw = async (req, res): Promise<void> => {
  const { id } = req.body;
  const withdraw = await Withdraw.findById(id);

  try {
    if (!withdraw) throw new Error("Yêu cầu hoàn tiền không tồn tại");
    if (withdraw.Status === 1) throw new Error("Đã hoàn tiền");

    const user =
      withdraw.User.Role === 1
        ? await Shipper.findById(withdraw.User.Id)
        : await Restaurant.findById(withdraw.User.Id);

    if (!user) throw new Error("User does not exist");
    if (user.Wallet < withdraw.Amount)
      throw new Error(
        `Tài khoản điện tử hiện tại:${user.Wallet} không đủ để rút`
      );

    user.Wallet -= withdraw.Amount;
    withdraw.Status = Constants.PAID.RESOLVE;

    await user.save();
    await withdraw.save();

    const newNoti = new NotificationModel({
      Title: "Yêu cầu rút tiền xử lý thành công.",
      Subtitle:
        "Yêu cầu rút tiền của bạn đã được xử lý thành công. Cám ơn bạn đã sử dụng FlashFood.",
      Receiver: withdraw.User,
      Thumbnail: environment.THUMB_WITHDRAW,
    });
    await newNoti.save();
    pushNotification(`${newNoti._id}`);

    console.log("[WITHDRAW]: Handle withdraw success.");
    res.send(nomalizeResponse(null, 0));
  } catch (e) {
    if (withdraw) {
      const newNoti = new NotificationModel({
        Title: "Yêu cầu rút tiền xử lý thất bại.",
        Subtitle: "Yêu cầu rút tiền của bạn đã được xử lý thất bại.",
        Receiver: withdraw.User,
        Thumbnail: environment.THUMB_WITHDRAW,
      });
      await newNoti.save();
      await pushNotification(`${newNoti._id}`);
    }

    console.log(`[WITHDRAW]: handle withdraw fail, ${e.message}.`);
    res.send(
      nomalizeResponse(e.message, Constants.SERVER.HANDLE_WITHDRAW_ERROR)
    );
  }
};

export const cancelWithdraw = async (req, res): Promise<void> => {
  const { id } = req.body;

  try {
    const withdraw = await Withdraw.findById(id).exec();

    if (!withdraw) throw new Error("Withdraw does not exist");
    if (withdraw.Status === 1) throw new Error("Withdrawal processed");

    withdraw.Status = Constants.PAID.CANCEL;
    await withdraw.save();

    if (withdraw) {
      const newNoti = new NotificationModel({
        Title: "Yêu cầu rút tiền xử lý thất bại.",
        Subtitle: "Yêu cầu rút tiền của bạn đã được xử lý thất bại.",
        Receiver: withdraw.User,
        Thumbnail: environment.THUMB_WITHDRAW,
      });
      await newNoti.save();

      await pushNotification(`${newNoti._id}`);
    }

    console.log("[WITHDRAW]: Handle cancel withdraw success.");
    res.send(nomalizeResponse(null, 0));
  } catch (e) {
    console.log(`[WITHDRAW]: handle withdraw fail, ${e.message}.`);
    res.send(nomalizeResponse(null, Constants.SERVER.HANDLE_WITHDRAW_ERROR));
  }
};

// UTIL

/**
 * Get user info and attach to withdraw object
 * @param withdraw
 */
const mapInfoForWithdraw = async (withdraw): Promise<void> => {
  try {
    switch (withdraw.User.Role) {
      case Constants.ROLE.SHIPPER: {
        const shipper = await Shipper.findById(withdraw.User.Id).select(
          "FullName Phone"
        );
        if (!shipper) throw new Error("Shipper does not exist");

        withdraw.User.Name = shipper.FullName;
        withdraw.User.Phone = shipper.Phone;
        break;
      }

      case Constants.ROLE.RESTAURANT: {
        const manager = await Manager.findOne({
          "Roles.Restaurant": withdraw.User.Id,
        }).select("FullName Phone");
        if (!manager) throw new Error("Manager does not exist");

        withdraw.User.Name = manager.FullName;
        withdraw.User.Phone = manager.Phone;
        break;
      }

      default:
        throw new Error("Role user invalid");
        break;
    }
  } catch (e) {
    console.log(`[MAP_INFO]: map info user for withdraw fail, ${e.message}`);
    withdraw.UserInfo = { FullName: "", Phone: "" };
  }
};
