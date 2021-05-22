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
        createdAt: user.createdAt,
      };
    });

    res.send(
      nomalizeResponse({ totalUsers, users }, 0, {
        totalPage: Math.ceil(totalUsers / Constants.PAGENATION.PER_PAGE),
        currentPage: page,
        perPage: Constants.PAGENATION.PER_PAGE,
      })
    );
  } catch (error) {
    console.log(`[ERROR]: user management: ${error}`);
    res.send(nomalizeResponse(null, 10));
  }
}
