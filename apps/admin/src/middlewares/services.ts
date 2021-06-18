import { validationResult } from "express-validator";
import passport from "passport";
import { nomalizeResponse } from "../utils/normalize";

export const jwtAuthentication = passport.authenticate("jwt", {
  session: false,
});

export function validateInput(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("[ERROR] validate", errors.array());
    return res.status(400).json(nomalizeResponse(null, 1));
  }
  next();
}
