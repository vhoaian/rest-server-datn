import { Manager, Restaurant, Shipper } from "@vohoaian/datn-models";
import Withdraw from "@vohoaian/datn-models/lib/models/Withdraw";
import { Constants } from "../environments/base";
import { nomalizeResponse } from "../utils/normalize";

export const getAllRequestWithdraw = async (req, res): Promise<void> => {
  try {
    const { page } = req.query;
    const option: any = { Status: Constants.PAID.UNRESOLVE };

    const totalComplaints = await Withdraw.countDocuments(option);

    const withdraws: any = await Withdraw.find(option)
      .limit(Constants.PAGENATION.PER_PAGE)
      .skip((page - 1) * Constants.PAGENATION.PER_PAGE);

    await Promise.all(
      withdraws.reduce((listPromise, currWithdraw) => {
        listPromise.push(mapInfoForWithdraw(currWithdraw));
        return listPromise;
      }, [])
    );

    res.send(
      nomalizeResponse({ listWithdraw: withdraws }, 0, {
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

  try {
    const withdraw = await Withdraw.findById(id);

    if (!withdraw) throw new Error("Withdraw does not exist");
    if (withdraw.Status === 1) throw new Error("Withdrawal processed");

    const user =
      withdraw.User.Role === 1
        ? await Shipper.findById(withdraw.User.Id)
        : await Restaurant.findById(withdraw.User.Id);

    if (!user) throw new Error("User does not exist");
    if (user.Wallet < withdraw.Amount) throw new Error("Unavailable balances");

    user.Wallet -= withdraw.Amount;
    withdraw.Status = 1;

    await user.save();
    await withdraw.save();

    console.log("[WITHDRAW]: Handle withdraw success.");
    res.send(nomalizeResponse(null, 0));
  } catch (e) {
    console.log(`[WITHDRAW]: handle withdraw fail, ${e.message}.`);
    res.send(nomalizeResponse(null, Constants.SERVER.HANDLE_WITHDRAW_ERROR));
  }
};

export const cancelWithdraw = async (req, res): Promise<void> => {
  const { id } = req.body;
  try {
    const withdraw = await Withdraw.findById(id);

    if (!withdraw) throw new Error("Withdraw does not exist");
    if (withdraw.Status === 1) throw new Error("Withdrawal processed");

    withdraw.Status = -1;
    await withdraw.save();

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
        withdraw.UserInfo = shipper;
        break;
      }

      case Constants.ROLE.RESTAURANT: {
        const manager = await Manager.findOne({
          "Roles.Restaurant": withdraw.User.Id,
        }).select("FullName Phone");
        if (!manager) throw new Error("Manager does not exist");
        withdraw.UserInfo = manager;
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
