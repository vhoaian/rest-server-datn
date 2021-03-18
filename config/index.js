const {nomalizePort} = require("../utils/normalize");

const PORT = nomalizePort(process.env.PORT || 8000);

const OPERATION_VAR = {
    PORT: PORT,
    GOOGLE: {
        gclientID: process.env.GOOGLE_CLIENT_ID,
        gsecret: process.env.GOOGLE_SECRET,
        gCallBackURL: "/auth/google/redirect",
        defaultPass: "google"
    },
    JWT:{
        secretKey: "final-project",
    }
};

const DEV_ENV_VAR = {
    ENV: "DEVELOPMENT",
    URL_SERVER: "http://localhost:8000",
    MONGO_DB: "mongodb://localhost:27017/nowDB",
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

module.exports =ENV;