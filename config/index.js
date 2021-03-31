const { nomalizePort } = require('../utils/normalize');
const bcryptJs = require('bcryptjs');

const PORT = nomalizePort(process.env.PORT || 8000);

const OPERATION_VAR = {
  PORT: PORT,
  GOOGLE: {
    gclientID: process.env.GOOGLE_CLIENT_ID,
    gsecret: process.env.GOOGLE_SECRET,
    gCallBackURL: '/auth/google/redirect',
    defaultPass: 'google',
  },
  JWT: {
    secretKey: 'final-project',
  },
  BCRYPT_SALT: bcryptJs.genSaltSync(10),
};

const DEV_ENV_VAR = {
  ENV: 'DEVELOPMENT',
  URL_SERVER: 'http://localhost:8000',
  MONGO_DB: 'mongodb://localhost:27017/nowDB',
};

const PRO_ENV_VAR = {
  ENV: 'PRODUCTION',
  URL_SERVER: process.env.API_URL_SERVER,
  MONGO_DB:
    process.env.ENVIRONMENT === 'DOCKER'
      ? 'mongodb://mongo:27017/nowDB'
      : 'mongodb://localhost:27017/nowDB',
};
console.log(process.env.ENVIRONMENT);

const ENV =
  process.env.ENVIRONMENT === 'DEVELOPMENT'
    ? { ...DEV_ENV_VAR, ...OPERATION_VAR }
    : { ...PRO_ENV_VAR, ...OPERATION_VAR };

module.exports = ENV;
