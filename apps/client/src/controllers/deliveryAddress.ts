import { City, DeliveryAddress, User } from '@vohoaian/datn-models';
import { nomalizeResponse } from '../utils/normalize';
import { withFilter } from '../utils/objects';

const DAFilter = withFilter('FullAddress Phone Geolocation id');

export async function getDeliveryAddresses(req, res) {
  const user = req.data._user;
  const addresses = await DeliveryAddress.find({ User: user });

  const mapped = addresses.map((a) => DAFilter(a.toObject({ virtuals: true })));

  const response = {
    errorCode: 0,
    data: {
      addresses: mapped,
    },
  };
  res.send(nomalizeResponse(response.data, response.errorCode));
}

export async function addDeliveryAddress(req, res) {
  const user = req.data._user;
  const { street, ward, district, city, longitude, latitude, phone } = req.body;
  const found = await City.findAddress(city, district, ward);
  let response;

  if (!found) {
    response = { errorCode: 3, data: null }; // dia chi khong ton tai
  } else {
    const newAddress = await DeliveryAddress.create({
      Street: street,
      Ward: found.Ward,
      District: found.District,
      City: found.City,
      Location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      User: user,
      Phone: phone,
    });

    response = {
      errorCode: 0,
      data: {
        address: DAFilter(newAddress.toObject({ virtuals: true })),
      },
    };
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
}

// Phải gửi lại đầy đủ thông tin
export async function updateDeliveryAddress(req, res) {
  const user = req.data._user;
  const { street, ward, district, city, longitude, latitude, phone } = req.body;
  const found = await City.findAddress(city, district, ward);
  let response;

  if (!found) {
    response = { errorCode: 3, data: null }; // dia chi khong ton tai
  } else {
    const updated = await DeliveryAddress.findByIdAndUpdate(
      req.params.id,
      {
        Street: street,
        Ward: found.Ward,
        District: found.District,
        City: found.City,
        Location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        Phone: phone,
      },
      { new: true }
    );

    if (!updated) {
      response = { errorCode: 4, data: null }; // id dia chi khong ton tai
    } else {
      response = {
        errorCode: 0,
        data: {
          address: DAFilter(updated.toObject({ virtuals: true })),
        },
      };
    }
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
}

export async function deleteDeliveryAddress(req, res) {
  const user = req.data._user;
  let response;

  const removed = await DeliveryAddress.findByIdAndDelete(req.params.id);

  if (!removed) {
    response = { errorCode: 4, data: null }; // id dia chi khong ton tai
  } else {
    response = {
      errorCode: 0,
      data: {
        address: DAFilter(removed.toObject({ virtuals: true })),
      },
    };
  }
  res.send(nomalizeResponse(response.data, response.errorCode));
}
