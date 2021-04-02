const { City } = require('@vohoaian/datn-models');
const { nomalizeResponse } = require('../utils');
const { validationResult } = require('express-validator');

const getCities = async (req, res) => {
  try {
    const cities = await City.findCities();
    res.send(nomalizeResponse(true, null, cities));
  } catch (error) {
    console.log('[ERROR]: GET CITIES:', error);
    res.send(nomalizeResponse(false, "can't get cities", null));
  }
};

const getDistricts = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { result } = req.data;

  res.send(nomalizeResponse(true, null, result));
};

const getWards = async (req, res) => {
  try {
    const { cityID, districtID } = req.params;
    const wards = await City.findWards(parseInt(cityID), parseInt(districtID));
    res.send(nomalizeResponse(true, wards));
  } catch (error) {
    console.log('[ERROR]: GET_WARD: ', error.message);
    res.send(nomalizeResponse(false, "can't get wards by cityID & districtID"));
  }
};

module.exports = {
  getCities,
  getDistricts,
  getWards,
};
