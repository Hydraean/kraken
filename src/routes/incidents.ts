const incidentsRoute = require("express").Router();
import Fuse from "fuse.js";
import lowdb from "../lowdb"


incidentsRoute.get("/", (req, res) => {
  let allEvents = lowdb.get("incidents").value();
  res.send(allEvents);
});

incidentsRoute.get("/search", (req,res)=>{
  let query: any = req.query.query;

  let incidentList = lowdb.get("incidents").value();

  const options = {
    keys: [
      "device_id",
      "name",
      "title",
      "reportee",
      "report_type",
      "date",
      "details",
      "source_platform",
      "type",
      "status",
      "fma",
    ],
  };

  if (query) {
    const fuse = new Fuse(incidentList, options);
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

module.exports = incidentsRoute;