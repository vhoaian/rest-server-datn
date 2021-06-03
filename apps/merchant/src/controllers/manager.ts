import { User } from '@vohoaian/datn-models';
import { nomalizeResponse } from '../utils/normalize';
import { withFilter } from '../utils/objects';

const UFilter = withFilter(
  'Phone Gender Status Point FullName Email Avatar id'
);

// Lấy tt KH (err=2: không tồn tại)
export async function getUser(req, res) {
  const id = req.params.uid;
  const user = await User.findById(id).exec();
  let response;
  if (!user) {
    response = { errorCode: 2, data: null }; // user khong ton tai
  } else {
    const info = user.toObject({ virtuals: true });

    response = {
      errorCode: 0,
      data: {
        user: UFilter(info),
      },
    };
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
}

// Cập nhật thông tin (err=2: không tồn tại)
export async function updateUser(req, res) {
  const id = req.params.uid;
  let response;
  const AllowedFieldFilter = withFilter('Gender FullName Email Avatar id');
  const newInfo = AllowedFieldFilter(req.body);
  const user = await User.findByIdAndUpdate(id, newInfo, { new: true }).exec();
  if (!user) {
    response = { errorCode: 2, data: null }; // user khong ton tai
  } else {
    const info = user.toObject({ virtuals: true });
    response = {
      errorCode: 0,
      data: {
        user: UFilter(info),
      },
    };
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
}
