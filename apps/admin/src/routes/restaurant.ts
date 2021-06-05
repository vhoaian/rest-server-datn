import express from "express";
import { query, body, param } from "express-validator";
const restaurantRouter = express.Router();
import { validateInput } from "../middlewares/services";
import { getRestaurantInfo, deleteRestaurant } from "../controllers/restaurant";

restaurantRouter.get("/info", getRestaurantInfo);
restaurantRouter.delete("/", deleteRestaurant);

export default restaurantRouter;
