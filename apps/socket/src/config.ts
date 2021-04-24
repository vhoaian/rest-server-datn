import * as DEV from "./environments/environment";
import * as PRO from "./environments/environment.prod";

const ENV = process.env.ENVIRONMENT === "PRODUCT" ? PRO : DEV;

console.log(ENV);

export default ENV.environment;
