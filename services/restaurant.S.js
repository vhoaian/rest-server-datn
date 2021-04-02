const { Restaurant, City } = require('@vohoaian/datn-models');
const Constants = require('../config');
const SORT_LABEL = {
  new: { CereatedAt: -1 },
  default: {},
};

const RestaurantService = {
  getRestaurants: async (page, sort) => {
    let option = {};
    let sortOpt = SORT_LABEL[sort];
    console.log(sortOpt);
    try {
      const totalRestaurants = await Restaurant.countDocuments(option);
      const maxPage = Math.ceil(totalRestaurants / Constants.PAGE.ITEM_IN_PAGE);

      let restaurantList = await Restaurant.find(option)
        .select(
          'Location Type Status Name ContractID OpenAt CloseAt Description Avatar Anoucenment Address CreatedAt'
        )
        .sort(sortOpt)
        .limit(Constants.PAGE.ITEM_IN_PAGE)
        .skip(Constants.PAGE.ITEM_IN_PAGE * (page - 1))
        .exec();
      if (restaurantList && restaurantList.length === 0) {
        return {
          success: true,
          message: 'No restaurant satisfy the requirements',
          data: { listPage: [], restaurantList, page, totalRestaurants },
        };
      }
      restaurantList = restaurantList.map((restaurant) => {
        const currHours = new Date().getHours();
        const open = new Date(restaurantList.OpenAt).getHours();
        const close = new Date(restaurantList.CloseAt).getHours();
        let isActive = false;
        const temp = restaurant.toObject();
        if (currHours >= open && currHours < close) {
          temp.isActive = true;
        } else {
          temp.isActive = false;
        }
        return temp;
      });

      const listPage = [];
      const currListPage =
        Constants.PAGE.PAGING_LIST > maxPage
          ? maxPage
          : Constants.PAGE.PAGING_LIST;

      //create array of pages for paging
      if (page === 1) {
        for (let i = 0; i < currListPage; i++) {
          listPage.push(page + i);
        }
      } else if (page === maxPage) {
        for (let i = currListPage - 1; i >= 0; i--) {
          listPage.push(page - i);
        }
      } else {
        for (let i = currListPage - 2; i >= -1; i--) {
          listPage.push(page - i);
        }
      }
      //get districts
      const districts = await City.findDistricts(79);
      return {
        success: true,
        data: {
          listPage,
          restaurantList,
          page,
          totalRestaurants,
          districts,
        },
      };
    } catch (error) {
      console.log(`[ERROR]: GET_RESTAURANT ${error}`);
      return { success: false, message: "can't get restaurant's list" };
    }
  },
};

module.exports = RestaurantService;
