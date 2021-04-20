import { User } from '@vohoaian/datn-models';
import { removeOTP, requestOTP, verifyOTP } from '@vohoaian/datn-otp';
import { sign } from 'jsonwebtoken';
import { environment } from '../environments/base';
import { loginWithGoogle } from '../services/Authentication';
import { nomalizeResponse } from '../utils/normalize';

type ResponseWithTokenOrUser = {
  errorCode: number;
  data: { user: string } | { token: string } | null;
};

type OTPSentResponse = {
  errorCode: number;
  data: null;
};

type OTPVerifiedResponse = {
  errorCode: number;
  data: null | { token: string };
};

type User = { Phone: string; Status: number; id?: string };

type VerifyFunction = (user: User, otp: string) => Promise<OTPVerifiedResponse>;

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
        errorCode: 1, // chua kich hoat
        data: {
          user: newUser.id,
        },
      };
    } else {
      // Kiem tra kich hoat sdt
      if (user.Status == -1) {
        response = {
          errorCode: 1, // chua kich hoat
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

function getToken(id) {
  const payload = {
    id: id,
  };
  // create token JWT
  const token = sign(payload, environment.JWT.secretKey, {
    expiresIn: '4h',
  });
  return token;
}

function requestOTPFor(isNewUser = false) {
  return async function (req, res) {
    let response: OTPSentResponse = {} as OTPSentResponse;
    const id = isNewUser ? req.body.user : req.user.id;
    const phone = req.body.phone;
    try {
      let u;
      if (isNewUser) {
        u = await User.findById(id).exec();
      }
      if (!u) {
        response = { errorCode: 2, data: null }; // user khong ton tai
      } else {
        if (isNewUser) {
          if (u.Status == -1) {
            await u.update({ Phone: phone }).exec();
          }
          await requestOTP(phone, true);
          response = { errorCode: 0, data: null };
        } else {
          if (u.Status == -1) {
            response = { errorCode: 5, data: null }; // user chua kich hoat
          } else {
            await requestOTP(phone, true);
            response = { errorCode: 0, data: null };
          }
        }
      }
    } catch (e) {
      response = { errorCode: 10, data: null };
    }
    res.send(nomalizeResponse(response.data, response.errorCode));
  };
}

export const requestOTPForExistUser = requestOTPFor(false);
export const requestOTPForThirdPartyRegistration = requestOTPFor(true);

function withNewRegistrationVerification(fn: VerifyFunction): VerifyFunction {
  return function (user, otp) {
    if (user.Status == -1) {
      return fn(user, otp);
    } else {
      return Promise.resolve({ errorCode: 5, data: null }); // user da kich hoat
    }
  };
}

async function verifyUserOTP(
  user: { Phone: string },
  otp: string
): Promise<OTPVerifiedResponse> {
  let response: OTPVerifiedResponse = {} as OTPVerifiedResponse;
  if (user.Phone.length > 0) {
    const isSuccess = await verifyOTP(user.Phone, otp);
    if (isSuccess) {
      response = { errorCode: 0, data: { token: getToken(user) } };
      removeOTP(user.Phone);
    } else {
      response = { errorCode: 3, data: null }; // ma otp sai
    }
  } else {
    response = { errorCode: 4, data: null }; // khong tim duoc so dien thoai
  }
  return response;
}

function withUserVerification(fn: VerifyFunction): VerifyFunction {
  return async function (user, otp) {
    let response: OTPVerifiedResponse = {} as OTPVerifiedResponse;
    try {
      const u = await User.findById(user.id).exec();
      if (!u) {
        response = { errorCode: 2, data: null }; // user khong ton tai
      } else {
        return fn(u, otp);
      }
    } catch (e) {
      response = { errorCode: 10, data: null };
    }
    return response;
  };
}

function verifyOTPFor(fn: VerifyFunction, isNewUser = false) {
  return async function (req, res) {
    let response: OTPVerifiedResponse = {} as OTPVerifiedResponse;
    response = await fn(
      { id: isNewUser ? req.body.user : req.user.id } as User,
      req.body.otp
    );
    res.send(nomalizeResponse(response.data, response.errorCode));
  };
}

export const verifyOTPForThirdPartyRegistration = verifyOTPFor(
  withUserVerification(withNewRegistrationVerification(verifyUserOTP)),
  true
);

export const verifyOTPForExistUser = verifyOTPFor(
  withUserVerification(verifyUserOTP),
  false
);

export async function getUserInfo(req, res) {
  // const { id } = req.user;
  // const { success, message, data } = await AuthService.getUserInfo(id);
  // res.send(nomalizeResponse(success, message, data));
}

export async function updateUserInfo(req, res) {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }
  // const { fullname, dob, gender, address, district, city } = req.body;
  // const { id } = req.user;
  // const { success, message, data } = await AuthService.updateUserInfoByID(
  //   id,
  //   fullname,
  //   dob,
  //   gender,
  //   address,
  //   district,
  //   city
  // );
  // res.send(nomalizeResponse(success, message, data));
}
