import express from "express";
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
import cors from "cors";
import bodyParser from "body-parser";
import { formatReport, guid, isFloat } from "./helpers";
import { getFMA } from "./fmaMapper";
import Fuse from "fuse.js";
import moment from "moment-timezone";
const fma_data = require("../fma.json");

require("dotenv").config();

io.set("origins", "*:*");

let port = process.env.PORT || 7000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
http.listen(port);

console.log(`===============================`);
console.log(`Kraken Demo API: ${port}`);
console.log(`===============================`);

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");

export const db = low(adapter);

// get status
app.get("/", (req, res) => {
  res.send({
    message: "Kraken Demo API v.0",
    status: "running",
  });
});

// get all events
app.get("/incidents", (req, res) => {
  let allEvents = db.get("incidents").value();

  res.send(allEvents);
});

// get all devices
app.get("/devices", (req, res) => {
  let allDevices = db.get("devices").value();

  res.send(allDevices);
});

// recieve raw reports
app.post("/report", (req, res) => {
  let payload = req.body.data;

  console.log(payload);

  if (payload) {
    var parseData = payload.replace(/"{/gi, "{").replace(/}"/gi, "}");
    try {
      let reportData = JSON.parse(parseData);
      let formattedReport = formatReport(reportData);

      // save report to event collection
      db.get("incidents").value().push(formattedReport);

      // record interaction with device.
      let deviceID = reportData.payload
        ? reportData.payload.uid
        : reportData.device_id;

      let deviceInstance = db
        .get("devices")
        .find({ device_id: deviceID })
        .value();

      if (!deviceInstance) {
        let newDevice = {
          id: guid(),
          device_id: deviceID,
          type: deviceID.includes("HN-") ? "node" : "gateway",
          first_interaction: moment()
            .tz("Asia/Taipei")
            .format("MMMM D YYYY,hh:mm:ss A"),
          last_interaction: moment()
            .tz("Asia/Taipei")
            .format("MMMM D YYYY,hh:mm:ss A"),
        };
        db.get("devices").value().push(newDevice);
      } else {
        deviceInstance.last_interaction = moment()
          .tz("Asia/Taipei")
          .format("MMMM D YYYY,hh:mm:ss A");
      }

      db.write();

      // broadcast updated report records
      let updatedRecords = db.get("incidents").value();
      io.emit("feedUpdate", { data: updatedRecords });

      console.log(`KRAKEN API: Report recieved from device: ${deviceID}`);

      res.json({ status: 200, message: "Kraken: Raw report recieved." });
    } catch (err) {
      console.log(err);
      res.status(400).json({
        message:
          "Error : Malformed Request, check the payload format and try again.",
      });
    }
  } else {
    res.status(400).json({ message: "Error : Incomplete Data Provided" });
  }
});

// search devices
app.get("/devices/search", (req, res) => {
  let query: any = req.query.query;

  let devicelist = db.get("devices").value();

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
});

// search incidents
app.get("/incidents/search", (req, res) => {
  let query: any = req.query.query;

  let incidentList = db.get("incidents").value();

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
});

// confirm / verify report

app.post("/report/confirm", (req, res) => {
  let reportID = req.body.id;

  if (reportID) {
    let reportInstance = db.get("incidents").find({ id: reportID }).value();
    if (reportInstance) {
      reportInstance.status = "CONFIRMED";
      reportInstance.verifier = "Hydraean_Admin";
      db.write();

      let updatedRecords = db.get("incidents").value();
      io.emit("feedUpdate", { data: updatedRecords });

      res.status(200).send({
        message: "Successfully confirmed report",
      });
    } else {
      res.status(400).send({
        message: "Process failed. Unable to find report with the ID provided",
        status: 400,
      });
    }
  } else {
    res.status(400).send({ status: 400, message: "Incomplete data provided" });
  }
});

// recieve report

app.post("/add/report", (req, res) => {
  let payload = req.body;

  if (payload.device_id && payload.device_id.trim() !== "") {
    if (
      payload.coordinates &&
      isFloat(payload.coordinates.lat) &&
      isFloat(payload.coordinates.long)
    ) {
      let newReport = {
        id: guid(),
        details: payload.details ? payload.details : "N/A",
        device_id: payload.device_id,
        type: payload.type ? payload.type : "emergency",
        name: payload.type ? payload.type : "emergency",
        title: payload.title ? payload.title : "WEB: Report Event",
        address: payload.address ? payload.address : "N/A",
        reportee: payload.reportee ? payload.reportee : "Anonymous",
        source_platform: "Web",
        date: moment().tz("Asia/Taipei").format("MMMM D YYYY,hh:mm:ss A"),
        coordinates: {
          long: payload.coordinates.long,
          lat: payload.coordinates.lat,
        },
        report_type: "AUTO",
        status: "PENDING",
      };

      // save report to event collection
      db.get("incidents").value().push(newReport);

      // record interaction with device.
      let deviceID = payload.device_id;

      let deviceInstance = db
        .get("devices")
        .find({ device_id: deviceID })
        .value();

      if (!deviceInstance) {
        let newDevice = {
          id: guid(),
          device_id: deviceID,
          type: deviceID.includes("HN-") ? "node" : "gateway",
          first_interaction: moment()
            .tz("Asia/Taipei")
            .format("MMMM D YYYY,hh:mm:ss A"),
          last_interaction: moment()
            .tz("Asia/Taipei")
            .format("MMMM D YYYY,hh:mm:ss A"),
        };
        db.get("devices").value().push(newDevice);
      } else {
        deviceInstance.last_interaction = moment()
          .tz("Asia/Taipei")
          .format("MMMM D YYYY,hh:mm:ss A");
      }

      db.write();

      let updatedRecords = db.get("incidents").value();
      // broadcast updated report records
      io.emit("feedUpdate", { data: updatedRecords });

      console.log(`KRAKEN API: Report recieved from device: ${deviceID}`);

      res.status(200).send({
        message: "Report Saved!",
        status: "ok",
      });
    } else {
      res.status(400).send({ message: "Provide proper GPS Coordinates" });
    }
  } else {
    res.status(400).send({ message: "Imcomplete data provided." });
  }
});

app.get("/dataset/fma", (req, res) => {
  res.send(fma_data);
});

app.post("/v1/report", (req, res) => {
  let reqData = req.body.data;
  let resData = {};

  if (reqData) {
    try {
      // parse payload
      let rData = JSON.parse(reqData);
      let reportInstanceCheck = db
        .get("incidents")
        .find({ id: rData.id })
        .value();

      // ::NOTE for testing report endpoint refactor the fma_classification variable is fixed to FMA-06
      // let fma_classification = getFMA([rData.cr.lg, rData.cr.lt]);
      let fma_classification = "FMA-06";

      // check if fma classification is valid.
      if (fma_classification) {
        // new report data mapped
        resData = {
          id: rData.id,
          details: rData.dt,
          device_id: rData.di,
          type: rData.tp === "cr" ? "emergency" : "illegal_fishing",
          name:
            rData.tp === "if" ? "Illegal Fishing Report" : "Emergency Report",
          title:
            rData.tp === "if" ? "Illegal Fishing Report" : "Emergency Report",
          fma: fma_classification,
          reportee: rData.rp,
          source_platform: rData.sp,
          date_reported: rData.dn,
          date_created: Date.now(),
          date_updated: Date.now(),
          date_confirmed: null,
          coordinates: {
            long: rData.cr.lg,
            lat: rData.cr.lt,
          },
          report_type: rData.md === "0" ? "manual" : "auto",
          status: "PENDING",
          updates: [],
        };

        // check if the report instance exists
        if (!reportInstanceCheck) {
          db.get("incidents").value().push(resData);
          let updatedRecords = db.get("incidents").value();
          io.emit("feedUpdate", { data: updatedRecords });
          db.write();
        } else {
          // update existing report
          console.log("updating report");
          let existingReport = db
            .get("incidents")
            .find({ id: rData.id })
            .value();

          let reportUpdate = {
            coordinates: { lat: rData.cr.lt, long: rData.cr.lg },
            date: rData.dn,
          };

          existingReport.date_updated = Date.now();
          let checkUpdateEntry = existingReport.updates.find(
            ({ coordinates }) =>
              coordinates.lat === reportUpdate.coordinates.lat &&
              coordinates.long === reportUpdate.coordinates.long
          );

          // write report update of coordinates to db if it doesn't exist.
          if (!checkUpdateEntry) {
            existingReport.updates.push(reportUpdate);
            db.write();
          }
        }

        // send valid response
        res.status(200).send({ message: "Report save successfully." });

        // broadcast updated report records
        let updatedRecords = db.get("incidents").value();
        io.emit("feedUpdate", { data: updatedRecords });
      } else {
        res
          .status(400)
          .send({ message: "Invalid Coordinates, no FMA classification!" });
      }
    } catch (err) {
      console.log(err);
      res.status(400).send("Error: Invalid data format");
    }
  } else {
    res.status(400).send("Missing data parameter.");
  }
});

// recieve and display payload data

app.post("/orion/test", (req, res) => {
  console.log(req.body.data);
  res.send("data recieved");
});

// Handle Socket Events
io.sockets.on("connection", function (socket: any) {
  // for initilisation of a node
});
