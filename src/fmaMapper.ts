const d3geo = require("d3-geo");
const fma_data = require("../fma.json");
const GeoJsonGeometriesLookup = require("geojson-geometries-lookup");

const glookup = new GeoJsonGeometriesLookup(fma_data);

// Determine if user in under Fishery Manage Area GeoJSON Data
// coordinates format: [lng, lat]
export const isFMA = (coordinates) => {
  return d3geo.geoContains(fma_data, coordinates);
};

// Look up which FMA a certain gps coodinate belongs to.
// coordinates format: [lng, lat]
export const getFMA = (coordinates) => {
  let targetCoordinates = { type: "Point", coordinates: coordinates };
  let result = glookup.getContainers(targetCoordinates, { ignorePoints: true });

  if (result.features.length) {
    return result.features[0].properties.FMA;
  } else {
    return false;
  }
};
