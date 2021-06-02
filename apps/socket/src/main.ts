import express from "express";
import cors from "cors";
import environment from "./config";
import { connect } from "@vohoaian/datn-models";
import orderComponent from "./components/order";
import notifyComponent from "./components/notification";
import { config as configSocket } from "./socket";
import * as ZaloPay from "./payment";
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
// Connect to the database
connect("PRODUCTION");

//
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", orderComponent);
app.use("/notification", notifyComponent);

app.use(function (req, res) {
  res.status(404).end();
});

// error handler
app.use(function (err, req, res, next) {
  res.status(500).end();
});

const server = app.listen(environment.PORT, () => {
  console.log(
    `The socket application is listening at http://localhost:${environment.PORT}`
  );
});

configSocket(server);

server.on("error", console.error);
