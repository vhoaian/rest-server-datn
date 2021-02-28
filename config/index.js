const Normalize = require("../utils/normalize");

const PORT = Normalize.nomalizePort(process.env.PORT || 8000);
module.exports ={
    PORT: PORT,
    GOOGLE: {
        gclientID: process.env.GOOGLE_CLIENT_ID,
        gsecret: process.env.GOOGLE_SECRET,
        gCallBackURL: "/auth/google/redirect",
    },
    JWT:{
        secretKey: "final-project",
    }
};