const passport = require('passport');
const ExtractJwt = require('passport-jwt').ExtractJwt;
const JwtStrategy = require('passport-jwt').Strategy;
const Constrant = require('../config');

// ===================================== jwt Authentication =====================================

passport.use(
  'jwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
      secretOrKey: Constrant.JWT.secretKey,
    },
    function (jwt_payload, done) {
      try {
        const user = { id: jwt_payload.id };
        console.log(jwt_payload);
        return done(null, user);
      } catch (error) {
        console.log('[ERROR]: ' + error);
      }
    }
  )
);
