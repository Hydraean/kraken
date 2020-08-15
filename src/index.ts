import express from "express";
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
import cors from "cors";
import bodyParser from "body-parser";
var path = require("path");

require("dotenv").config();

io.set("origins", "*:*");

let port = process.env.PORT || 7000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("client"));
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
  res.sendFile(path.join(__dirname + "/index.html"));
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
app.get("/events", (req, res) => {
  let allEvents = db.get("events").value();

  res.send(allEvents);
});

// get all advisories
app.get("/feed", (req, res) => {
  let data = db.get("advisories").value();
  res.send(data);
});

app.post("/report", (req, res) => {
  let payload = req.body.data;

  if (payload) {
    console.log(payload);
    res.send("okay");
  } else {
    res.send("error");
  }
});

// Handle Socket Events
io.sockets.on("connection", function (socket: any) {
  // for initilisation of a node
});
