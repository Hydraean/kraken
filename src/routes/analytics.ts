const AnalyticsRoute = require("express").Router();
import lowdb from "../lowdb";
import { dateFiller, fmaData } from "../helpers";
import moment from "moment";

const fma_list = fmaData.map((x: any) => x.fma);

let incident_summary = [];
let incidents_data = lowdb.get("incidents").value();
let incidentsByDate = [];
let allIncidentEvent = [];

let incidents_normalized_dates = incidents_data.map((x: any) => {
  let incident = x;
  incident.date_reported = moment(new Date(incident.date_reported)).format(
    "MM-DD-YYYY"
  );
  return incident;
});

// prepare incident overview data
fma_list.forEach((fma: any) => {
  let date_groups = [];
  let filtered_by_fma = incidents_normalized_dates.filter(
    (f: any) => f.fma === fma
  );

  filtered_by_fma.forEach((s: any) => {
    let dateInstance = date_groups.find(
      (ic: any) => ic.date === s.date_reported
    );
    if (!dateInstance) {
      date_groups.push({
        date: s.date_reported,
        records: [s],
      });
    } else {
      dateInstance.records.push(s);
    }
  });

  let fma_record = {
    fma: fma,
    records: date_groups,
  };
  incidentsByDate.push(fma_record);
});

// prepare complete incidents grouped by date
fma_list.forEach((fma: any) => {
  let date_groups = [...dateFiller()];
  let filtered_by_fma = incidents_normalized_dates.filter(
    (f: any) => f.fma === fma
  );

  filtered_by_fma.forEach((s: any) => {
    let dateInstance = date_groups.find(
      (ic: any) => ic.date === s.date_reported
    );
    if (!dateInstance) {
      date_groups.push({
        date: s.date_reported,
        activityCount: 1,
      });
    } else {
      dateInstance.activityCount += 1;
    }
  });

  let fma_record = {
    fma: fma,
    records: date_groups,
  };
  incident_summary.push(fma_record);
});

// all incident event
fma_list.forEach((fma: any) => {
  let date_groups = [];

  incidents_normalized_dates.forEach((s: any) => {
    let dateInstance = date_groups.find(
      (ic: any) => ic.date === s.date_reported
    );
    if (!dateInstance) {
      date_groups.push({
        date: s.date_reported,
        activityCount: 1,
      });
    } else {
      dateInstance.activityCount += 1;
    }
  });

  allIncidentEvent = date_groups;
});

// endpoints
AnalyticsRoute.get("/", (req, res) => {
  let response = {
    fma_list: fmaData,
    incidents_overview: incident_summary,
  };
  res.send(response);
});

AnalyticsRoute.get("/incidents/overview", (req, res) => {
  let response = incident_summary;
  res.send(response);
});

AnalyticsRoute.get("/incidents/complete", (req, res) => {
  let response = incidentsByDate;
  res.send(response);
});

AnalyticsRoute.get("/incidents/all", (req, res) => {
  let response = allIncidentEvent;
  res.send(response);
});

AnalyticsRoute.get("/incidents/date-search", (req, res) => {
  let fma = req.query.fma ? req.query.fma.toUpperCase() : "all";
  let startDate = moment(new Date(req.query.startDate));
  let endDate = moment(new Date(req.query.endDate));

  const isBetweenDates = (date: any) => {
    let dateToCompare = moment(new Date(date));
    return dateToCompare.isBetween(startDate, endDate);
  };

  if (startDate.isValid() && endDate.isValid()) {
    if (!fma_list.includes(fma)) {
      let data_filtered_by_date = allIncidentEvent.filter((x: any) =>
        isBetweenDates(x.date)
      );
      let result = {
        mode: "all",
        context: "/incidents/date-search",
        fma: fma,
        results: data_filtered_by_date,
      };
      res.send(result);
    } else {
      let data_filtered_by_date = incident_summary
        .find((i: any) => i.fma === fma)
        .records.filter((x: any) => isBetweenDates(x.date));
      let result = {
        context: "/incidents/date-search",
        fma: fma,
        results: data_filtered_by_date,
      };
      res.send(result);
    }
  } else {
    res.status(400).send({
      message: "Erro: Invalid dates provided!",
    });
  }
});

module.exports = AnalyticsRoute;
