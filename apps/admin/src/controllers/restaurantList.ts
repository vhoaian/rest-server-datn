import { City, Restaurant, Receipt, Manager } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";
import { Constants } from "../environments/base";
import geocoder from "../utils/geocoder";
import bcryptjs from "bcryptjs";

export async function getRestaurantManagementInfo(req, res) {
  //
  const {
    city: cityName,
    search,
    page,
    district: districtName,
    partner,
  } = req.query;

  const option: any = { IsPartner: partner };

  //search string for restaurant name
  if (search !== "") {
    const regex = new RegExp(`${search}.*`, "g");
    option.Name = regex;
  }

  try {
    //get cities and dsitrict in it
    if (cityName) {
      //filter for city
      option["Address.City"] = cityName;
      //filter for district
      if (districtName) {
        option["Address.District"] = districtName;
      }
    }
    //calc total restaurant fit with option serach
    const totalRestaurants = await Restaurant.countDocuments(option).exec();

    let restaurants: any = await Restaurant.find(option)
      .collation({ locale: "en_US", numericOrdering: true })
      .select("Address Type Status Name ContractID CreatedAt Rating IsPartner")
      //.populate("Reviews")
      .limit(Constants.PAGENATION.PER_PAGE)
      .skip((page - 1) * Constants.PAGENATION.PER_PAGE)
      .exec();
    const receiptFee: any = await Promise.all(
      restaurants.map((restaurant: any) => {
        return Receipt.find({
          ["Payer.Id"]: restaurant._id,
          Role: 2,
        }).exec();
      })
    );

    restaurants = restaurants.map((restaurant: any, i) => {
      const address = `${restaurant.Address.Street} ${restaurant.Address.Ward} ${restaurant.Address.District}`;
      return {
        _id: restaurant._id,
        address,
        type: restaurant.Type,
        isService:
          restaurant.Status === Constants.RESTAURANT.STOP_SERVICE
            ? false
            : true,
        name: restaurant.Name,
        contractID: restaurant.ContractID,
        createdAt: restaurant.CreatedAt,
        rating: restaurant.Rating || 0,
        isPartner: restaurant.IsPartner,
        serviceCharge:
          receiptFee[i].Status === Constants.PAID.UNRESOLVE
            ? "Nợ phí"
            : "Đã thanh toán",
      };
    });

    res.send(
      nomalizeResponse(
        {
          restaurants,
          totalRestaurants,
        },
        0,
        {
          totalPage: Math.ceil(
            totalRestaurants / Constants.PAGENATION.PER_PAGE
          ),
          currentPage: page,
          perPage: Constants.PAGENATION.PER_PAGE,
        }
      )
    );
  } catch (error) {
    console.log(`[ERROR]: restaurant management: ${error.message}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_RES_ERROR));
  }
}

export async function createNewRestanrant(req, res) {
  const {
    name,
    contractID,
    email,
    password,
    cityID,
    districtID,
    openAt,
    closeAt,
    city,
    district,
    ward,
    address,
    pakingFee,
  } = req.body;

  const resAddress = {
    Street: address,
    Ward: ward,
    District: district,
    City: city,
  };
  const isExists = await Restaurant.findOne({
    Name: name,
    Address: resAddress,
  }).exec();

  if (isExists) {
    return res.send(nomalizeResponse(null, Constants.SERVER.RES_EXISTS));
  }
  //get goecode
  let latitude, longitude;
  try {
    const tempAddress = `${address}, ${ward}, ${district}, ${city}`;
    const result = await geocoder.geocode(tempAddress);
    //console.log(result);

    latitude = result[0].latitude;
    longitude = result[0].longitude;
  } catch (error) {
    console.log(`[ERROR] get location ${error.message}`);
    return res.send(nomalizeResponse(null, Constants.CALL_API_ERROR));
  }
  try {
    //check is this restaurant exists

    //create new restaurant
    const restaurant = new Restaurant({
      Name: name,
      ContractID: contractID,
      Address: resAddress,
      OpenAt: openAt,
      CloseAt: closeAt,
      Location: { type: "Point", coordinates: [longitude, latitude] },
      Type: 0,
      Phone: contractID,
      City: cityID,
      District: districtID,
      PakingFee: pakingFee,
    });
    //create new fake manager
    const newRestaurant = await restaurant.save();
    const newManager = new Manager({
      Email: email,
      Password: bcryptjs.hashSync(password, Constants.BCRYPT_SALT),
      FullName: name,
      Status: 1,
      Roles: [{ Restaurant: newRestaurant._id }],
    });
    await newManager.save();
    console.log(restaurant);
    return res.send(nomalizeResponse(null, 0));
  } catch (error) {
    console.log(`[ERROR] create res ${error.message}`);
    return res.send(nomalizeResponse(null, Constants.SERVER.CREATE_RES_ERROR));
  }
}
