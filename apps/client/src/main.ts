import express from "express";
import cors from "cors";
import passport from "passport";
import indexRouter from "./routes/index";
import authRouter from "./routes/auth";
import cityRouter from "./routes/city";
import restaurantRouter from "./routes/restaurant";
import userRouter from "./routes/user";
import orderRouter from "./routes/order";
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
app.use("/cities", cityRouter);
app.use("/restaurants", restaurantRouter);
app.use("/users", userRouter);
app.use("/orders", orderRouter);

app.use(function (req, res) {
  res.status(404).end();
});

// error handler
app.use(function (err, req, res, next) {
  res.status(500).end();
});

const server = app.listen(environment.PORT, () => {
  console.log(
    `The client application is listening at http://localhost:${environment.PORT}`
  );
});

server.on("error", console.error);
