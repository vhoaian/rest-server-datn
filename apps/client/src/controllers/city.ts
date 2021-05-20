import { City } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";

export async function getCities(req, res) {
  try {
    const cities = await City.findCities();
    res.send(nomalizeResponse(cities));
  } catch (error) {
    console.log("[ERROR]: GET CITIES:", error);
    res.send(nomalizeResponse(null, 10));
  }
}

async function getDistricts(req, res) {
  const { result } = req.data;

  res.send(nomalizeResponse(result));
}

export async function getWards(req, res) {
  const { result } = req.data;

  res.send(nomalizeResponse(result));
}
