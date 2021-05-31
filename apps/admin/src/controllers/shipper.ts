import { nomalizeResponse } from "../utils/normalize";
import { Shipper } from "@vohoaian/datn-models";
import { Constants } from "../environments/base";

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
    const totalShippers = await Shipper.countDocuments(option).exec();

    let shippers: any = await Shipper.find(option)
      .select("Phone Email Point Status CreatedAt")
      .limit(Constants.PAGENATION.PER_PAGE)
      .skip((page - 1) * Constants.PAGENATION.PER_PAGE)
      .exec();
    //sort by point
    shippers = shippers.sort((a, b) => {
      return b.Point - a.Point;
    });

    shippers = shippers.map((user: any) => {
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
      nomalizeResponse({ totalShippers, shippers }, 0, {
        totalPage: Math.ceil(totalShippers / Constants.PAGENATION.PER_PAGE),
        currentPage: page,
        perPage: Constants.PAGENATION.PER_PAGE,
      })
    );
  } catch (error) {
    console.log(`[ERROR]: user management: ${error}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_SHIPPER_ERROR));
  }
}
