import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { environment } from '../environments/environment';

passport.use(
  'jwt',
  new Strategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
      secretOrKey: environment.JWT.secretKey,
    },
    function (jwt_payload, done) {
      try {
        const user = { id: jwt_payload.id };
        return done(null, user);
      } catch (error) {
        console.log('[ERROR]: ' + error);
      }
    }
  )
);