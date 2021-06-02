import Express from "express";
import notificationController from "../../socket/controller/notification";
const router = Express.Router();

router.get("/", (req, res) => {
  res.send("NOTIFICATION");
});

router.post("/", (req, res) => {
  const { notificationID } = req.body;
  notificationController.pushNotification(notificationID);
  res.send("Push noti success");
});

export default router;
