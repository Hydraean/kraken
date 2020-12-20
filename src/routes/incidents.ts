const incidentsRoute = require("express").Router();
import Fuse from "fuse.js";
import lowdb from "../lowdb";
import { formatIncidents } from "../helpers";

incidentsRoute.get("/", (req, res) => {
  let allEvents = lowdb.get("incidents").value();

  let responseData = formatIncidents(allEvents);

  res.send(responseData);
});

incidentsRoute.get("/search", (req, res) => {
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

    let searchResults = results.map((x) => x.item);

    results = formatIncidents(searchResults);

    res.send(results);
  } else {
    res.status(400).send({
      message: "Search failed. No query provided.",
      status: 400,
    });
  }
});

module.exports = incidentsRoute;
