import { Manager } from "@vohoaian/datn-models";
import { removeOTP, requestOTP, verifyOTP } from "@vohoaian/datn-otp";
import { nomalizeResponse } from "../utils/normalize";
import { getToken } from "../utils/tokens";

type OTPSentResponse = {
  errorCode: number;
  data: null | { Manager: string };
};

type OTPVerifiedResponse = {
  errorCode: number;
  data: null | { token: string } | { Manager: string };
};

function withPhone(fn) {
  return async function (req, res) {
    if (req.body.phone) {
      req.uphone = req.body.phone;
    } else if (req.user) {
      const found = await Manager.findById(req.user.id).exec();
      if (found) {
        req.uphone = found.Phone;
      }
    }
    fn(req, res);
  };
}

export const requestOTPForLogin = withPhone(async function (req, res) {
  const phone = req.uphone;
  const u = await Manager.findOne({ Phone: phone }).exec();
  if (!u) {
    const newManager = await Manager.create({
      FullName: phone,
      Gender: 0,
      Phone: phone,
      Status: -1, // chua xac nhan sdt tren he thong
    });
  }
  await requestOTP(phone, true);
  const response: OTPSentResponse = { errorCode: 0, data: null };
  res.send(nomalizeResponse(response.data, response.errorCode));
});

export const verifyOTPForLogin = withPhone(async function (req, res) {
  const otp = req.body.otp;
  const phone = req.uphone;
  let response: OTPVerifiedResponse;

  const manager = await Manager.findOne({ Phone: phone }).exec();
  if (!manager) {
    response = { errorCode: 2, data: null }; // Manager khong ton tai
  } else {
    const isSuccess = await verifyOTP(manager.Phone, otp);
    if (isSuccess) {
      response = { errorCode: 0, data: { token: getToken(manager.id) } };
      removeOTP(manager.Phone);
      if (manager.Status == -1) {
        manager.Status = 0;
        await manager.save();
      }
    } else {
      response = { errorCode: 3, data: null }; // ma otp sai
    }
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
});
