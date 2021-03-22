const axiosClient = require('../api');
const { User } = require('@vohoaian/datn-models');
const jwt = require('jsonwebtoken');
const UserManager = require('../manager/UserManager');
const Constants = require('../config');

const AuthService = {
  loginWithGoogle: async (id, accessToken) => {
    try {
      console.log({ id, accessToken });
      const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${id}`;
      const query = {};

      const response = await axiosClient.post(url);
      const { email, name } = response;
      console.log("User's info from GG:", response);
      // check user in DB
      let user = await User.findOne({ email }).select('email Status').exec();

      //save info of user to controller
      if (!user) {
        user = new User({
          GoogleID: id,
          FullName: name,
          Email: email,
          Password: Constants.GOOGLE.defaultPass,
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
        const token = jwt.sign(payload, config.SECRET_KEY_JWT);
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
    try {
      //register new account
      if (user) {
      }
      //vertify phone Number
      else {
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
        const token = jwt.sign(payload, config.SECRET_KEY_JWT);
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
      }
    } catch (error) {}
  },
};

module.exports = AuthService;
