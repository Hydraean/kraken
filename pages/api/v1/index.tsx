const response = {
  message: "Kraken API v1",
  description: "API for the Seantinel Platform",
};

export default (req, res) => {
  res.status(200).json(response);
};
