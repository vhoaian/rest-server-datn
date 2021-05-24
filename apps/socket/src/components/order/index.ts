import Express from "express";
import * as controller from "./controller";
const router = Express.Router();

router.get("/", controller.getHomePage);
router.post("/create-order", controller.createOrder);
router.post("/callback-zalopay", controller.cbZaloPay);

export default router;
