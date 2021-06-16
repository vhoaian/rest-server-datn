import { Shipper } from "@vohoaian/datn-models";
import { removeOTP, requestOTP, verifyOTP } from "@vohoaian/datn-otp";
import { nomalizeResponse } from "../utils/normalize";
import { getToken } from "../utils/tokens";

type OTPSentResponse = {
  errorCode: number;
  data: null;
};

type OTPVerifiedResponse = {
  errorCode: number;
  data: null | { token: string };
};

function withPhone(fn) {
  return async function (req, res) {
    if (req.body.phone) {
      req.uphone = req.body.phone;
    } else if (req.user) {
      const found = await Shipper.findById(req.user.id).exec();
      if (found) {
        req.uphone = found.Phone;
      }
    }
    fn(req, res);
  };
}

export const requestOTPForLogin = withPhone(async function (req, res) {
  const phone = req.uphone;
  const u = await Shipper.findOne({ Phone: phone }).exec();
  if (!u) {
    return res.send(nomalizeResponse(null, 2)); // Shipper khong ton tai
  } else if (u.Status == -2) {
    return res.send(nomalizeResponse(null, 6)); // user da bi khoa
  }

  await requestOTP(phone, true);
  const response: OTPSentResponse = { errorCode: 0, data: null };
  res.send(nomalizeResponse(response.data, response.errorCode));
});

export const verifyOTPForLogin = withPhone(async function (req, res) {
  const otp = req.body.otp;
  const phone = req.uphone;
  let response: OTPVerifiedResponse;

  const shipper = await Shipper.findOne({ Phone: phone }).exec();
  if (!shipper) {
    response = { errorCode: 2, data: null }; // Shipper khong ton tai
  } else if (shipper.Status == -2) {
    response = { errorCode: 6, data: null }; // Manager da bi khoa
  } else {
    const isSuccess = await verifyOTP(shipper.Phone, otp);
    if (isSuccess) {
      response = { errorCode: 0, data: { token: getToken(shipper.id) } };
      removeOTP(shipper.Phone);
      if (shipper.Status == -1) {
        shipper.Status = 0;
        await shipper.save();
      }
    } else {
      response = { errorCode: 3, data: null }; // ma otp sai
    }
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
});
