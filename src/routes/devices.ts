const devicesRoute = require("express").Router();
import Fuse from "fuse.js";
import lowdb from "../lowdb"


devicesRoute.get("/", (req, res) => {
  let allEvents = lowdb.get("devices").value();

  res.send(allEvents);
});

devicesRoute.get("/search",(req,res)=>{
  let query: any = req.query.query;

  let devicelist = lowdb.get("devices").value();

  const options = {
    keys: ["device_id", "first_interaction", "last_interaction"],
  };

  if (query) {
    const fuse = new Fuse(devicelist, options);
    let results: any = fuse.search(query);
    results = results.map((x) => x.item);
    res.send(results);
  } else {
    res.status(400).send({
      message: "Search failed. No query provided.",
      status: 400,
    });
  }
})

module.exports = devicesRoute;