import * as DEV from "./environments/environment";
import * as PRO from "./environments/environment.prod";

const ENV = process.env.ENVIRONMENT === "PRODUCT" ? PRO : DEV;

export default ENV.environment;