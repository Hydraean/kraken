import express, { query } from "express";
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
import cors from "cors";
import bodyParser from "body-parser";
import { formatReport, guid, isFloat } from "./helpers";
var path = require("path");
import Fuse from "fuse.js";
import moment from "moment";
import { report } from "process";

require("dotenv").config();

io.set("origins", "*:*");

let port = process.env.PORT || 7000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
http.listen(port);

var collections = {};
var nodeList = [];

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

app.get("/devices", (req, res) => {
  let allDevices = db.get("devices").value();

  res.send(allDevices);
});

// broadcast network feed in small chunks
app.get("/network/feed", (req, res) => {
  console.log("accessing feed...");
  let data = db.get("advisories").value();
  res.send(data);
});

// recieve raw reports
app.post("/report", (req, res) => {
  let payload = req.body.data;

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
          first_interaction: moment().format("MMMM D YYYY,hh:mm:ss A"),
          last_interaction: moment().format("MMMM D YYYY,hh:mm:ss A"),
        };
        db.get("devices").value().push(newDevice);
      } else {
        deviceInstance.last_interaction = moment().format(
          "MMMM D YYYY,hh:mm:ss A"
        );
      }

      db.write();

      let updatedRecords = db.get("incidents").value();
      // broadcast updated report records
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

  const fuse = new Fuse(devicelist, options);
  let results: any = fuse.search(query);
  results = results.map((x) => x.item);
  res.send(results);
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
      "address",
    ],
  };

  const fuse = new Fuse(incidentList, options);
  let results: any = fuse.search(query);
  results = results.map((x) => x.item);

  res.send(results);
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

  console.log(req.body);

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
        address: "N/A",
        reportee: payload.reportee ? payload.reportee : "Anonymous",
        source_platform: "Web",
        date: moment().format("MMMM D YYYY,hh:mm:ss A"),
        coordinates: {
          long: payload.coordinates.long,
          lat: payload.coordinates.lat,
        },
        report_type: "AUTO",
        status: "PENDING",
      };

      console.log(newReport);

      res.send("ok");
    } else {
      res.status(400).send({ message: "Provide proper GPS Coordinates" });
    }
  } else {
    res.status(400).send({ message: "Imcomplete data provided." });
  }
});

// Handle Socket Events
io.sockets.on("connection", function (socket: any) {
  // for initilisation of a node
});
