const DatasetRoute = require("express").Router();
const fma_data = require("../../fma.json");


DatasetRoute.get("/:slug", (req, res) => {

  let datasetType = req.params.slug.toLowerCase();
  let dataset;

  const availableDatasets = {
    available_datasets: [
    "/fma"
  ]
}

  switch(datasetType){
    case 'fma':
      dataset = fma_data;
    break;
    default:
      dataset = availableDatasets;
  }



  res.send(dataset)
});

module.exports = DatasetRoute;



