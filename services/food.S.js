const { FoodCategory, Food } = require('@vohoaian/datn-models');

const getFoodsOfRestaurant = async (restaurantID) => {
  try {
    const foodCategories = await FoodCategory.find({ Restaurant: restaurantID })
      .select('_id Name')
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
      let foodList = {};
      foodCategories.forEach((category, i) => {
        foodList[category.Name] = foodsArr[i];
      });

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
