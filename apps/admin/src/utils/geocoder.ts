//import * as NodeGeocoder from "node-geocoder";
import { environment } from "../environments/base";
import NodeGeocoder = require("node-geocoder");
const options: NodeGeocoder.Options = {
  provider: "google",

  // Optional depending on the providers
  //fetch: customFetchImplementation,
  httpAdapter: "https",
  language: "VN",
  apiKey: environment.GOOGLE.GEOCODE_API, // for Mapquest, OpenCage, Google Premier
  formatter: null, // 'gpx', 'string', ...
};

//console.log(environment.GOOGLE.GEOCODE_API);
const geocoder = NodeGeocoder(options);

export default geocoder;
