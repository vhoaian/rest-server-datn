const passport = require("passport");

module.exports = {
    googleAuthentication: passport.authenticate('google',{ 
        session: false,
        prompt:"select_account",
        scope:["profile", 'email']
    }),
}