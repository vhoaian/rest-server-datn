const { FoodCategory, Food } = require('@vohoaian/datn-models');

const getFoodsOfRestaurant = async (restaurantID) => {
  try {
    const foodCategories = await FoodCategory.find({ Restaurant: restaurantID })
      .select('_id')
      .exec();
    //console.log(foodCategories);
    if (foodCategories && foodCategories.length > 0) {
      //using multiple thread
      const foodPromies = foodCategories.map((category) => {
        return new Promise(async (resolve, reject) => {
          try {
            const foods = await Food.find({ FoodCategory: category }).exec();
            resolve(foods);
          } catch (error) {
            console.log(`[ERROR] GET FOODS: ${error}`);
            reject(error);
          }
        });
      });

      const foodsArr = await Promise.all(foodPromies);
      const foodList = foodsArr.flat();
      console.log(foodList);
      return {
        success: true,
        data: foodList,
      };
    } else {
      return { success: false, message: 'Restaurant have had any food yet' };
    }
  } catch (error) {
    console.log(`[ERROR]: GET FOOD_LIST ${error}`);
    return { success: false, message: 'Get food list failed' };
  }
};

module.exports = {
  getFoodsOfRestaurant,
};
