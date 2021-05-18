import { User } from '@vohoaian/datn-models';
import { removeOTP, requestOTP, verifyOTP } from '@vohoaian/datn-otp';
import { loginWithGoogle } from '../services/Authentication';
import { nomalizeResponse } from '../utils/normalize';
import { getToken } from '../utils/tokens';

type ResponseWithTokenOrUser = {
  errorCode: number;
  data: { user: string } | { token: string } | null;
};

type OTPSentResponse = {
  errorCode: number;
  data: null | { user: string };
};

type OTPVerifiedResponse = {
  errorCode: number;
  data: null | { token: string } | { user: string };
};

function withId(fn) {
  return async function (req, res) {
    if (req.user) {
      req.uid = req.user.id;
    } else {
      if (req.body.user) {
        req.uid = req.body.user;
      } else if (req.body.phone) {
        const found = await User.findOne({ Phone: req.body.Phone }).exec();
        if (found) {
          req.uid = found.id;
        }
      }
    }
    fn(req, res);
  };
}

function withPhone(fn) {
  return async function (req, res) {
    if (req.body.phone) {
      req.uphone = req.body.phone;
    } else if (req.user) {
      const found = await User.findById(req.user.id).exec();
      if (found) {
        req.uphone = found.Phone;
      }
    }
    fn(req, res);
  };
}

export const requestOTPForRegistration = withId(
  withPhone(async function (req, res) {
    const id = req.uid;
    const phone = req.uphone;
    let response: OTPSentResponse;
    const u = await User.findById(id).exec();
    if (!u) {
      response = { errorCode: 2, data: null }; // user khong ton tai
    } else {
      if (u.Status == -1) {
        await u.update({ Phone: phone }).exec();
      }
      await requestOTP(phone, true);
      response = { errorCode: 0, data: null };
    }
    res.send(nomalizeResponse(response.data, response.errorCode));
  })
);

export const verifyOTPForRegistration = withId(async function (req, res) {
  const otp = req.body.otp;
  const id = req.uid;
  let response: OTPVerifiedResponse;

  const user = await User.findById(id).exec();
  if (!user) {
    response = { errorCode: 2, data: null }; // user khong ton tai
  } else {
    if (user.Status == -1) {
      if (user.Phone.length > 0) {
        const isSuccess = await verifyOTP(user.Phone, otp);
        if (isSuccess) {
          User.findByIdAndUpdate(id, { Status: 0 }).exec();
          response = { errorCode: 0, data: { token: getToken(user) } };
          removeOTP(user.Phone);
        } else {
          response = { errorCode: 3, data: null }; // ma otp sai
        }
      } else {
        response = { errorCode: 4, data: null }; // khong tim duoc so dien thoai
      }
    } else {
      response = { errorCode: 5, data: null }; // user da kich hoat
    }
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
});

export async function loginWithGoogleAccount(req, res) {
  const { idToken } = req.body;
  let response: ResponseWithTokenOrUser = {} as ResponseWithTokenOrUser;

  const info = await loginWithGoogle(idToken);
  if (info) {
    const { id, name, picture, email } = info;
    const user = await User.findOne({ GoogleID: id }).exec();
    // Neu chua co trong csdl => tao tai khoan moi
    if (!user) {
      const newUser = await User.create({
        GoogleID: id,
        FullName: name,
        Email: email,
        Avatar: picture,
        Status: -1, // chua xac nhan sdt tren he thong
      });
      response = {
        errorCode: 0, // chua kich hoat
        data: {
          user: newUser.id,
        },
      };
    } else {
      // Kiem tra kich hoat sdt
      if (user.Status == -1) {
        response = {
          errorCode: 0, // chua kich hoat
          data: {
            user: user.id,
          },
        };
      } else {
        getToken(user);
        response = {
          errorCode: 0,
          data: {
            token: getToken(user.id),
          },
        };
      }
    }
  } else {
    response = { errorCode: 2, data: null }; // token sai hoac het han
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
}

export const requestOTPForLogin = withPhone(async function (req, res) {
  const phone = req.uphone;
  let response: OTPSentResponse;
  const u = await User.findOne({ Phone: phone }).exec();
  if (!u) {
    response = { errorCode: 2, data: null }; // user khong ton tai
  } else {
    if (u.Status == -1) {
      response = { errorCode: 6, data: { user: u.id } }; // user chua kich hoat
    } else {
      await requestOTP(phone, true);
      response = { errorCode: 0, data: null };
    }
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
});

export const requestOTPForPhoneRegistration = withPhone(async function (
  req,
  res
) {
  const phone = req.uphone;
  let response: OTPSentResponse;
  const u = await User.findOne({ Phone: phone }).exec();
  if (!u) {
    response = { errorCode: 2, data: null }; // user khong ton tai
  } else {
    if (u.Status == -1) {
      await requestOTP(phone, true);
      response = { errorCode: 0, data: null };
    } else {
      response = { errorCode: 5, data: null }; // user da kich hoat
    }
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
});

export const verifyOTPForPhoneRegistration = withPhone(async function (
  req,
  res
) {
  const otp = req.body.otp;
  const phone = req.uphone;
  let response: OTPVerifiedResponse;

  const user = await User.findOne({ Phone: phone }).exec();
  if (!user) {
    response = { errorCode: 2, data: null }; // user khong ton tai
  } else {
    if (user.Status == -1) {
      if (user.Phone.length > 0) {
        const isSuccess = await verifyOTP(user.Phone, otp);
        if (isSuccess) {
          User.findOneAndUpdate({ Phone: phone }, { Status: 0 }).exec();
          response = { errorCode: 0, data: { token: getToken(user) } };
          removeOTP(user.Phone);
        } else {
          response = { errorCode: 3, data: null }; // ma otp sai
        }
      } else {
        response = { errorCode: 4, data: null }; // khong tim duoc so dien thoai
      }
    } else {
      response = { errorCode: 5, data: null }; // user da kich hoat
    }
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
});

export const verifyOTPForLogin = withPhone(async function (req, res) {
  const otp = req.body.otp;
  const phone = req.uphone;
  let response: OTPVerifiedResponse;

  const user = await User.findOne({ Phone: phone }).exec();
  if (!user) {
    response = { errorCode: 2, data: null }; // user khong ton tai
  } else {
    if (user.Status != -1) {
      const isSuccess = await verifyOTP(user.Phone, otp);
      if (isSuccess) {
        response = { errorCode: 0, data: { token: getToken(user) } };
        removeOTP(user.Phone);
      } else {
        response = { errorCode: 3, data: null }; // ma otp sai
      }
    } else {
      response = { errorCode: 6, data: { user: user.id } }; // user chua kich hoat
    }
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
});
