const { City } = require('@vohoaian/datn-models');
const express = require('express');
const { param } = require('express-validator');
const customerCityRouter = express.Router();
const CityController = require('../controllers/city.C');

customerCityRouter.get('/', CityController.getCities);

customerCityRouter.get(
  '/:cityID/districts',
  param('cityID').custom(async (value, { req }) => {
    const id = parseInt(value);

    const result = await City.findDistricts(id);
    if (!result) {
      return Promise.reject('Not found City by cityID');
    }

    req.data = { result };
  }),
  CityController.getDistricts
);

customerCityRouter.get(
  '/:cityID/districts/:districtID/wards',
  CityController.getWards
);

module.exports = customerCityRouter;
