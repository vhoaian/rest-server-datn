import { City, Restaurant } from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";
import { Constants } from "../environments/base";
import geocoder from "../utils/geocoder";

export async function getRestaurantManagementInfo(req, res) {
  const { city: cityID, search, page, district: districtID } = req.query;
  let districts = [];
  const option: any = {};
  let selectedCity: any = null;
  if (search !== "") {
    const regex = new RegExp(`${search}.*`, "g");
    option.Name = regex;
  }

  try {
    const cities = await City.find({}).exec();

    if (cityID !== 0) {
      selectedCity = cities.filter((elm) => elm.Id === cityID);
      if (selectedCity.length === 0) {
        return res.send(nomalizeResponse(null, Constants.SERVER.INVALID_PARAM));
      }
      option["Address.City"] = selectedCity[0].Name;
      districts = selectedCity[0].Districts;

      if (districtID !== 0) {
        const selectedDistrict = districts.filter(
          (elm) => elm.Id === districtID
        );
        if (selectedDistrict.length === 0) {
          return res.send(
            nomalizeResponse(null, Constants.SERVER.INVALID_PARAM)
          );
        }
        option["Address.District"] = selectedDistrict[0].Name;
      }
    }

    const totalRestaurants = await Restaurant.countDocuments(option).exec();

    let restaurants: any = await Restaurant.find(option)
      .collation({ locale: "en_US", numericOrdering: true })
      .select("Address Type Status Name ContractID CreatedAt Reviews")
      //.populate("Reviews")
      .limit(Constants.PAGENATION.PER_PAGE)
      .skip((page - 1) * Constants.PAGENATION.PER_PAGE)
      .exec();

    restaurants = restaurants.map((restaurant: any) => {
      const address = `${restaurant.Address.Street} ${restaurant.Address.Ward} ${restaurant.Address.District}`;
      return {
        _id: restaurant._id,
        address,
        type: restaurant.Type,
        status: restaurant.Status,
        name: restaurant.Name,
        contractID: restaurant.ContractID,
        createdAt: restaurant.CreatedAt,
        reviews: restaurant.Reviews,
      };
    });

    const seftRestaurants: any = [];
    const adminRestaurants: any = [];
    restaurants.forEach((restaurant: any) => {
      if (restaurant.type === 0 /*Constants.RESTAURANT.ADMIN_TYPE */) {
        adminRestaurants.push(restaurant);
      } else {
        seftRestaurants.push(restaurant);
      }
    });

    res.send(
      nomalizeResponse(
        {
          cities,
          districts,
          adminRestaurants,
          seftRestaurants,
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
    console.log(`[ERROR]: restaurant management: ${error}`);
    res.send(nomalizeResponse(null, Constants.SERVER.GET_RES_ERROR));
  }
}

export async function createNewRestanrant(req, res) {
  const {
    name,
    contractID,
    openTime,
    closeTime,
    city,
    district,
    ward,
    address,
  } = req.body;

  const resAddress = {
    Street: address,
    Ward: ward,
    District: district,
    City: city,
  };
  let latitude, longitude;
  try {
    const tempAddress = `${address}, ${ward}, ${district}, ${city}`;
    const result = await geocoder.geocode(tempAddress);
    console.log(result);

    latitude = result[0].latitude;
    longitude = result[0].longitude;
  } catch (error) {
    console.log(`[ERROR] get location ${error}`);
    return res.send(nomalizeResponse(null, Constants.CALL_API_ERROR));
  }
  try {
    const restaurant = new Restaurant({
      Name: name,
      ContractID: contractID,
      Address: resAddress,
      OpenAt: openTime,
      CloseAt: closeTime,
      Location: { type: "Point", coordinates: [longitude, latitude] },
      Type: 0,
    });

    await restaurant.save();
    console.log(restaurant);
    return res.send(nomalizeResponse(restaurant));
  } catch (error) {
    console.log(`[ERROR] get location ${error}`);
    return res.send(nomalizeResponse(null, Constants.SERVER.CREATE_RES_ERROR));
  }
}
