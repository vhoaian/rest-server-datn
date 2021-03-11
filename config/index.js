const Normalize = require("../utils/normalize");

const PORT = Normalize.nomalizePort(process.env.PORT || 8000);

const OPERATION_VAR = {
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

const DEV_ENV_VAR = {
    ENV: "DEVELOPMENT",
    URL_SERVER: "http://localhost:8000",
  };
  
const PRO_ENV_VAR = {
ENV: "PRODUCTION",
URL_SERVER: process.env.API_URL_SERVER,
};


const ENV = process.env.REACT_APP_ENVIRONMENT === "PRODUCTION"
? { ...PRO_ENV_VAR,
    ...OPERATION_VAR }
: { ...DEV_ENV_VAR,
    ...OPERATION_VAR };

console.log(ENV);
module.exports =ENV;