import { City } from '@vohoaian/datn-models';
import express from 'express';
import { param } from 'express-validator';
import { getCities, getDistricts, getWards } from '../controllers/city';
import { validateInput } from '../middlewares/services';
const customerCityRouter = express.Router();

customerCityRouter.get('/', getCities);

customerCityRouter.use(
  '/:cityID',
  param('cityID').custom(async (value, { req }) => {
    const id = +value;

    const result = await City.findDistricts(id);
    if (!result || result.length == 0) {
      return Promise.reject('Not found City by cityID');
    }

    req.data = { result };
  })
);

customerCityRouter.get('/:cityID/districts', validateInput, getDistricts);

customerCityRouter.get(
  '/:cityID/districts/:districtID/wards',
  param('districtID').custom(async (value, { req }) => {
    const cityID = +req.params?.cityID;
    const districtID = +value;

    const result = await City.findWards(cityID, districtID);
    if (!result || result.length == 0) {
      return Promise.reject('Not found District by districtID');
    }

    req.data = { result };
  }),
  validateInput,

  getWards
);

export default customerCityRouter;
