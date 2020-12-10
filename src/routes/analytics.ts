const AnalyticsRoute = require("express").Router();
import lowdb from "../lowdb"

AnalyticsRoute.get("/", (req, res) => {

  res.send("Analytics:: In progress");
});

module.exports = AnalyticsRoute;