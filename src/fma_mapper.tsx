const d3geo = require("d3-geo");
const fma_data = require("../fma.json");

console.log(fma_data);

const getFMA = (coordinates) => {
  return d3geo.geoContains(fma_data, coordinates);
};

let coords = [-91.33057280941561, 38.14850647789078];

let out = getFMA(coords);
console.log(out);
