import Express from "express";
import * as controller from "./controller";
const router = Express.Router();

router.get("/", controller.getHomePage)

export default router;