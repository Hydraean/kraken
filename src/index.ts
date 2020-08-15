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

// Handle Socket Events
io.sockets.on("connection", function (socket: any) {
  // for initilisation of a node
});
