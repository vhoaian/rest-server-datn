import express from "express";
import cors from "cors";
import passport from "passport";
import { environment } from "./environments/environment";
import { connect } from "@vohoaian/datn-models";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
// Connect to the database
connect("PRODUCTION");

app.use(function (req, res) {
  res.status(404).end();
});

// error handler
app.use(function (err, req, res, next) {
  res.status(500).end();
});

const server = app.listen(environment.PORT, () => {
  console.log(
    `The admin application is listening at http://localhost:${environment.PORT}`
  );
});

server.on("error", console.error);
