import { User } from "@vohoaian/datn-models";
import { Constants } from "../environments/base";
import { nomalizeResponse } from "../utils/normalize";

export async function getUserManagementInfo(req, res) {
  const { page, email, phone } = req.query;
  const option = {};
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

    let users = await User.find(option)
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
    console.log(`[ERROR]: user management: ${error}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_USER_ERROR));
  }
}

export async function blockUserById(req, res) {
  const { id } = req.body;
  const { user } = req.data;
  try {
    const update = { Status: 0 };

    if (user.Status === -1) {
      return res.send(
        nomalizeResponse(null, Constants.SERVER.CAN_NOT_FIND_USER)
      );
    }
    user.Status === 0 ? (update.Status = -2) : update.Status === 0;

    const result = await User.findByIdAndUpdate({ _id: id }, update, {
      new: true,
    }).exec();

    res.send(nomalizeResponse(result, 0));
  } catch (error) {
    console.log(`[ERROR]: block user: ${error}`);
    res.send(nomalizeResponse(null, Constants.SERVER.BLOCK_USER_ERROR));
  }
}
