const { Restaurant } = require('@vohoaian/datn-models');
const { validationResult } = require('express-validator');

function createRestaurant(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const restaurant = new Restaurant({
    Name: req.body.name,
    ContractID: req.body.contractID,
    Address: req.body.address,
    OpenAt: req.body.openAt,
    CloseAt: req.body.closeAt,
    // Location: ?
    // Type: 0,
    Description: req.body.description,
    Avatar: req.body.avatar,
    Anouncement: req.body.anouncement,
    ParkingFree: req.body.parkingFee,
    Status: req.body.status,
  });

  restaurant.save();
  res.json({});
}

function getRestaurants(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  Restaurant.find({})
    .exec()
    .then((docs) => {
      res.json(docs);
    })
    .catch(() => res.status(500).json({ errors: ['Error'] }));
}

module.exports = { createRestaurant, getRestaurants };
