import express from "express";
import cors from "cors";
import passport from "passport";
import indexRouter from "./routes/index";
import authRouter from "./routes/auth";
import restaurantRouter from "./routes/restaurant";
import managerRouter from "./routes/manager";
import imageRouter from "./routes/image";
import { environment } from "./environments/environment";
import { connect } from "@vohoaian/datn-models";
const app = express();

// import ggAPI from "@rest-servers/google-api";
// const origin = "312/20 Tôn Đản, Quận 4, Thành Phố HCM";
// const destination = "Đại học khoa học tự nhiên quận 5";
// ggAPI.calcDistance(origin, destination).then((d) => console.log(d));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
// Connect to the database
connect("PRODUCTION");

require("./middlewares");

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/restaurants", restaurantRouter);
app.use("/managers", managerRouter);
app.use("/images", imageRouter);

app.use(function (req, res) {
  res.status(404).end();
});

// error handler
app.use(function (err, req, res, next) {
  res.status(500).end();
});

const server = app.listen(environment.PORT, () => {
  console.log(
    `The merchant application is listening at http://localhost:${environment.PORT}`
  );
});

server.on("error", console.error);
