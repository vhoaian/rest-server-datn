import * as DEV from "./environments/environment";
import * as PRO from "./environments/environment.prod";

const ENV = process.env.ENVIRONMENT === "PRODUCTION" ? PRO : DEV;

// console.log(ENV);
console.log(process.env.ENVIRONMENT);

export default ENV.environment;
