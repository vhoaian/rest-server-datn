const axiosClient = require('../api');
const { User } = require('@vohoaian/datn-models');
const jwt = require('jsonwebtoken');
const UserManager = require('../manager/UserManager');
const Constants = require('../config');
const bcryptJs = require('bcryptjs');

const AuthService = {
  loginWithGoogle: async (id, accessToken) => {
    try {
      const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${id}`;
      const query = {};

      const response = await axiosClient.post(url);
      const { email, name } = response;
      // check user in DB
      let user = await User.findOne({ Email: email })
        .select('Email Status')
        .exec();
      //save info of user to controller
      if (!user) {
        user = new User({
          GoogleID: id,
          FullName: name,
          Email: email,
          Password: bcryptJs.hashSync(
            Constants.GOOGLE.defaultPass,
            Constants.BCRYPT_SALT
          ),
        });

        //save new user Info waiting for user to vertify phone
        const userID = UserManager.registerMe(user);

        return {
          success: true,
          message: "vertify user's phone",
          data: {
            token: null,
            userID: userID,
            validate: false,
          },
        };
      } else {
        const payload = {
          id: user._id,
        };
        // create token JWT
        const token = jwt.sign(payload, Constants.JWT.secretKey, {
          expiresIn: '4h',
        });
        return {
          success: true,
          message: 'Login with GG success',
          data: {
            token: token,
            validate: true,
          },
        };
      }
    } catch (error) {
      console.log('[ERROR]: GG_LOGIN ', error);
      return {
        success: false,
        message: 'Login with GG failed',
        data: null,
      };
    }
  },

  registerNewUser: async (user, userID, phone) => {
    //register new account
    if (user) {
      try {
      } catch (error) {
        console.log(`[ERROR] CREATE NEW ACCOUNT ${error}`);
        return { success: false, messge: 'create new account failed' };
      }
    }
    //vertify phone Number
    else {
      try {
        const newUser = UserManager.getUserByHandleID(userID);
        // vertify phone munber with otp

        //vertify success
        newUser.Phone = phone;
        //newUser.Status =
        const result = await newUser.save();

        const payload = {
          id: result._id,
        };

        // create token JWT
        const token = jwt.sign(payload, Constants.JWT.secretKey, {
          expiresIn: '4h',
        });
        return {
          success: true,
          message: "vertify user's phone number success",
          data: {
            token: token,
            validate: true,
          },
        };
        //vertify failed
        // return {
        //     success: false,
        //     message: "vertify user's phone number failed",
        //     data: null
        // }
      } catch (error) {
        console.log(`[ERROR]: VERTIFY_PHONE ${error}`);
        return {
          success: false,
          message: "vertify user's phone number failed",
        };
      }
    }
  },

  getUserInfo: async (id) => {
    try {
      const userInfo = await User.findById({ _id: id })
        .select('FullName Phone Email Status Gender DOB Address Point')
        .exec();
      if (!userInfo) {
        return { success: false, message: 'User not exists' };
      }

      if (userInfo.Status === -1) {
        return { success: false, message: `User's accounthas been block` };
      }

      return {
        success: true,
        message: `Get user's info success`,
        data: userInfo,
      };
    } catch (error) {
      console.log(`[ERROR]: GET_INFO ${error}`);
      return { success: false, messge: "Get user's info failed" };
    }
  },

  updateUserInfoByID: async (
    id,
    fullname,
    dob,
    gender,
    address,
    district,
    city
  ) => {
    try {
      //find User
      const userInfo = await User.findByIdAndUpdate({ _id: id })
        .select('FullName Gender DOB Address District City')
        .exec();

      if (!userInfo) {
        return { success: false, message: 'User not exists' };
      }
      //add new value of update
      userInfo.FullName = fullname ? fullname : userInfo.FullName;
      userInfo.Gender = gender ? gender : userInfo.Gender;
      userInfo.Address = address ? address : userInfo.Address;
      userInfo.District = district ? district : userInfo.District;
      userInfo.City = city ? city : userInfo.City;
      userInfo.DOB = dob ? dob : userInfo.DOB;

      //save new update
      const result = await useInfo.save();
      console.log(result);

      return {
        success: true,
        message: `Update user's info success`,
        data: result,
      };
    } catch (error) {
      console.log(`[ERROR]: UPDATE_INFO ${error}`);
      return { success: false, messge: "Update user's info failed" };
    }
  },
};

module.exports = AuthService;
