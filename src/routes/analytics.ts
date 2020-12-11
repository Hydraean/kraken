const AnalyticsRoute = require("express").Router();
import lowdb from "../lowdb"
import {fmaData} from "../helpers"


const fma_list = fmaData.map((x:any)=> x.fma)

AnalyticsRoute.get("/", (req, res) => {

  let response = {
    fma_list: fma_list
  }

  res.send(response)
});

module.exports = AnalyticsRoute;