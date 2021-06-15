import { User } from "@vohoaian/datn-models";
import { Constants } from "../environments/base";
import { nomalizeResponse } from "../utils/normalize";
import mailController from "../mail/mailController";

export async function getUserManagementInfo(req, res) {
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
    const totalUsers = await User.countDocuments(option).exec();
    const numberOfPages = Math.ceil(totalUsers / Constants.PAGENATION.PER_PAGE);

    if (page <= 0 || page > numberOfPages) {
      return res.send(nomalizeResponse(null, Constants.SERVER.INVALID_PARAM));
    }

    let users: any = await User.find(option)
      .select("Phone Email Point Status CreatedAt")
      .limit(Constants.PAGENATION.PER_PAGE)
      .skip((page - 1) * Constants.PAGENATION.PER_PAGE)
      .exec();
    //sort by point
    users = users.sort((a, b) => {
      return b.Point - a.Point;
    });

    users = users.map((user) => {
      return {
        _id: user._id,
        phone: user.Phone,
        email: user.Email,
        point: user.Point,
        status: user.Status,
        createdAt: user.CreatedAt,
      };
    });

    res.send(
      nomalizeResponse({ totalUsers, users }, 0, {
        totalPage: numberOfPages,
        currentPage: page,
        perPage: Constants.PAGENATION.PER_PAGE,
      })
    );
  } catch (error) {
    console.log(`[ERROR]: user management: ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_USER_ERROR));
  }
}

//Status: [-2: Khóa tài khoản, -1: chưa xác thực, 0: bình thường]

export async function blockUserById(req, res) {
  const { id, reason } = req.body;
  const { user } = req.data;
  try {
    const update = { Status: Constants.STATUS.NORMAL };

    if (user.Status === Constants.STATUS.UNCHECK) {
      return res.send(
        nomalizeResponse(null, Constants.SERVER.CAN_NOT_FIND_USER)
      );
    }
    user.Status === Constants.STATUS.NORMAL
      ? (update.Status = Constants.STATUS.BLOCK)
      : update.Status === Constants.STATUS.NORMAL;
    if (
      update.Status === Constants.STATUS.BLOCK &&
      typeof user.Email !== "undefined"
    ) {
      await mailController.sendMailLockAccountWithMessage(
        user.FullName,
        user.Email,
        `Tài khoản bạn tạm thời bị khóa với lý do: ${reason}`,
        "vn"
      );
    }
    const result = await User.findByIdAndUpdate({ _id: id }, update, {
      new: true,
    }).exec();

    res.send(nomalizeResponse(result, 0));
  } catch (error) {
    console.log(`[ERROR]: block user: ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.BLOCK_USER_ERROR));
  }
}
