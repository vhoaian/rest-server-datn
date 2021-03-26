const passport = require('passport');

module.exports = {
  jwtAuthentication: () => {
    return passport.authenticate('jwt', { session: false });
  },
};
