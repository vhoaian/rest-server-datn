const passport = require("passport");

module.exports = {
    jwtAuthorization: () =>{
        return passport.authenticate("jwt", {session: false});
    }
}