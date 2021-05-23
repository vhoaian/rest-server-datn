import { City, DeliveryAddress, Food, User } from '@vohoaian/datn-models';
import { nomalizeResponse } from '../utils/normalize';
import { withFilter } from '../utils/objects';

// const DAFilter = withFilter('FullAddress Phone Geolocation id');
export async function addOrder(req, res) {
  const { foods, total } = req.body;

  const ids = foods.map((f) => f.id);
  await Food.find({ _id: { $in: ids } });
}
