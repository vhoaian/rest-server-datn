const passport = require("passport");
const jwt = require('jsonwebtoken');
const Constants = require("../config");


const loginwithGoogleAccount = (req, res, next) =>{
    passport.authenticate('google',{session: false}, 
    (error,userAuth, info) =>{    
        if (error || !userAuth) { 
            console.log(error);
            return res.send({
                status: "Failed",
                message: error.message,
                data: [],
            })
        }
        else{
            req.login(userAuth, (error)=>{
                if (error)
                {
                    console.log(error);
                    return res.send({
                        status: "Failed",
                        message: error.message,
                        data: [],
                    })
                }
                const token = jwt.sign({userAuth}, Constants.JWT.secretKey, { expiresIn: '4h' });
                // return token to client
                
                return res.send({
                    status: "Success",
                    message: "Successful login with google account",
                    data: token,
                })
            });
        }
    })(req,res,next);
} 

const vertifyPhoneNumber = async (req,res,next)=>{

}

module.exports = authController = {
    loginwithGoogleAccount,
    vertifyPhoneNumber
};