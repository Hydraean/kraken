const d3geo = require("d3-geo");
const fma_data = require("../fma.json");
const GeoJsonGeometriesLookup = require("geojson-geometries-lookup");

console.log(fma_data);

const glookup = new GeoJsonGeometriesLookup(fma_data);

const getFMA = (coordinates) => {
  return d3geo.geoContains(fma_data, coordinates);
};

let coords = [120.783102, 14.581689];

let out = getFMA(coords);
console.log(out);

const point1 = { type: "Point", coordinates: coords };

let lu = glookup.getContainers(point1, { ignorePoints: true });

console.log(lu.features[0].properties);
