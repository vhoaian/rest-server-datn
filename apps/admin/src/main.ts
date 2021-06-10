import express from "express";
import cors from "cors";
import passport from "passport";
import { environment } from "./environments/environment";
import { connect } from "@vohoaian/datn-models";
const app = express();

import autoCalcReceipt from "./autoCalcReceipt";
autoCalcReceipt.runAutoCalcReceipt();
autoCalcReceipt.runAutoLockLatePayReceipt();

import ggAPI from "@rest-servers/google-api";
ggAPI.test();

import restaurantListRouter from "./routes/restaurantList";
import userRouter from "./routes/user";
import generalRouter from "./routes/general";
import shipperRouter from "./routes/shipper";
import reportRouter from "./routes/report";
import complaintRouter from "./routes/complaint";
import cityRouter from "./routes/city";
import authRouter from "./routes/auth";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
// Connect to the database
//connect("MYSELF", environment.MONGO_DB);
connect("PRODUCTION");
require("./middlewares");

import { jwtAuthentication } from "./middlewares/services";

app.use("/auth", authRouter);
app.use("/restaurants", jwtAuthentication, restaurantListRouter);
app.use("/users", jwtAuthentication, userRouter);
app.use("/shippers", jwtAuthentication, shipperRouter);
app.use("/report", jwtAuthentication, reportRouter);
app.use("/complaint", jwtAuthentication, complaintRouter);
app.use("/cities", jwtAuthentication, cityRouter);
app.use("/", jwtAuthentication, generalRouter);

app.use(function (req, res) {
  res.status(404).end();
});

// error handler
app.use(function (err, req, res, next) {
  console.log(err.message);
  res.status(500).end();
});

const server = app.listen(environment.PORT, () => {
  console.log(
    `The admin application is listening at http://localhost:${environment.PORT}`
  );
});

server.on("error", console.error);
