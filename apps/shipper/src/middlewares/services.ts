import { validationResult } from 'express-validator';
import passport from 'passport';
import { nomalizeResponse } from '../utils/normalize';

export const jwtAuthentication = passport.authenticate('jwt', {
  session: false,
});

export function validateInput(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(400).json(nomalizeResponse(null, 1)).end();
  }
  next();
}

export function validatePrivateResource(options?: {
  paramsIdField?: string;
  bodyIdField?: string;
  dataIdField?: string;
}) {
  if (!options) {
    return function (req, res, next) {
      if (
        req.user.id != req.params.uid &&
        req.user.id != req.body.uid &&
        req.user.id != req.data?.uid
      ) {
        return res.status(403).end();
      }
      next();
    };
  }
  return function (req, res, next) {
    if (
      options &&
      ((options.paramsIdField &&
        req.user.id != req.params[options.paramsIdField]) ||
        (options.bodyIdField && req.user.id != req.body[options.bodyIdField]) ||
        (options.dataIdField && req.user.id != req.data[options.dataIdField]))
    ) {
      return res.status(403).end();
    }
    next();
  };
}
