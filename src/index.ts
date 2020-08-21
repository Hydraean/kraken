import express, { query } from "express";
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
import cors from "cors";
import bodyParser from "body-parser";
import { formatReport, guid } from "./helpers";
var path = require("path");
import Fuse from "fuse.js";
import moment from "moment";

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

// host landing page
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

// get status
app.get("/status", (req, res) => {
  res.send({
    message: "Kraken Demo API v.0",
    status: "running",
    total_nodes: nodeList.length,
    total_collections: Object.keys(collections).length,
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
          first_interaction: moment().format("MMMM D YYYY - hh:mm:ss A"),
          last_interaction: moment().format("MMMM D YYYY - hh:mm:ss A"),
        };
        db.get("devices").value().push(newDevice);
      } else {
        deviceInstance.last_interaction = moment().format(
          "MMMM D YYYY - hh:mm:ss A"
        );
      }

      db.write();

      let updatedRecords = db.get("incidents").value();
      // broadcast updated report records
      io.emit("feedUpdate", { data: updatedRecords });

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
    ],
  };

  const fuse = new Fuse(incidentList, options);
  let results: any = fuse.search(query);
  results = results.map((x) => x.item);

  res.send(results);
});

// Handle Socket Events
io.sockets.on("connection", function (socket: any) {
  // for initilisation of a node
});
