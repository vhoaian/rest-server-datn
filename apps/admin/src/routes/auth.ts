import { Admin } from "@vohoaian/datn-models";
import express from "express";
import { body } from "express-validator";
import { validateInput } from "../middlewares/services";
import { nomalizeResponse } from "../utils/normalize";
import { Constants } from "../environments/base";
const authRouter = express.Router();
import bcryptjs from "bcryptjs";
import { getToken } from "../utils/tokens";

authRouter.post(
  "/",
  body("email").notEmpty().isEmail(),
  body("password").notEmpty().isString(),
  validateInput,
  async function (req, res) {
    const { email, password } = req.body;
    try {
      const admin = await Admin.findOne({ Email: email }).exec();
      if (!admin) {
        return res.send(nomalizeResponse(null, Constants.SERVER.EMAIL_INVAILD));
      } else if (!bcryptjs.compareSync(password, admin.Password)) {
        return res.send(nomalizeResponse(null, Constants.SERVER.PASS_INVAILD));
      } else {
        res.send(nomalizeResponse({ jwt: getToken(admin._id) }));
      }
    } catch (error) {
      console.log(`[ERROR]: login admin: ${error.message}`);
      res.send(nomalizeResponse(null, Constants.SERVER.LOGIN_ERROR));
    }
  }
);

// authRouter.post("/create", async function (req, res) {
//   const { email, password, fullname } = req.body;
//   console.log({ email, password, fullname });
//   try {
//     const newAdmin = new Admin({
//       Email: email,
//       Password: bcryptjs.hashSync(password, Constants.BCRYPT_SALT),
//       FullName: fullname,
//     });
//     await newAdmin.save();
//     res.send(nomalizeResponse("success", 0));
//   } catch (error) {
//     console.log(error.message);
//     res.send(nomalizeResponse(null));
//   }
// });

export default authRouter;
