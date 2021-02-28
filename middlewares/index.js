const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Constrant = require("../config");
const handleError = require("../utils/handleError");

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

// ===================================== Google Oauth20 Strategy =====================================
passport.use("google", new GoogleStrategy({
    clientID: Constrant.GOOGLE.gclientID,
    clientSecret: Constrant.GOOGLE.gsecret,
    callbackURL: Constrant.GOOGLE.gCallBackURL,
}, async function(accessToken, refreshToken, profile, cb){
    //S1: check email from google is exists
    try{
      const {name, picture, email} = profile._json;
      console.log({name, picture, email});
      //const [error, result] = await handleError();
      //const isExists
      // if (error)
      // {
      //     return cb(error, null);
      // }
      //S2: if email is not exists, create new account base on google email
      // if (!isExists)
      // {

      //   //return cb(null, newUser);
      // } 
      //S3: if email is exists, return account 
      //return cb(null, isExists);
      return cb(null, "SSSS");
    }
    catch (error) {
      console.log("[ERROR]: " + error);
    }
}));