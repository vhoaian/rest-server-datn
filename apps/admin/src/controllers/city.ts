import { City } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";
import { Constants } from "../environments/base";

export async function getCities(req, res) {
  const { city } = req.query;
  try {
    const cities = await City.find({}).exec();
    let districts: any = [];
    if (city) {
      districts = cities.filter((elm) => elm.Name === city)[0].Districts;
    }
    res.send(nomalizeResponse({ cities, districts }));
  } catch (error) {
    console.log(`[ERROR]: get city ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_CITY_ERROR));
  }
}
