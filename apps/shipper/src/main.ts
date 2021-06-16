import express from "express";
import cors from "cors";
import passport from "passport";
import indexRouter from "./routes/index";
import authRouter from "./routes/auth";
import shipperRouter from "./routes/shipper";
import orderRouter from "./routes/order";
import chatroomRouter from "./routes/chatroom";
import notificationRouter from "./routes/notification";
import withdrawRouter from "./routes/withdraw";
import shipperreviewRouter from "./routes/shipperreview";
import { environment } from "./environments/environment";
import { connect } from "@vohoaian/datn-models";
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
// Connect to the database
connect("PRODUCTION");

require("./middlewares");

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/shippers", shipperRouter);
app.use("/orders", orderRouter);
app.use("/notifications", notificationRouter);
app.use("/withdraws", withdrawRouter);
app.use("/chatrooms", chatroomRouter);
app.use("/reviews", shipperreviewRouter);

app.use(function (req, res) {
  res.status(404).end();
});

// error handler
app.use(function (err, req, res, next) {
  res.status(500).end();
});

const server = app.listen(environment.PORT, () => {
  console.log(
    `The shipper application is listening at http://localhost:${environment.PORT}`
  );
});

server.on("error", console.error);
