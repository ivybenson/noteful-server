const { NODE_ENV } = require("./config");
const logger = require("./logger");

function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    response = { message: error.message, error };
  }

  console.error(error);
  logger.error(error.message);
  res.status(500).json(response);
}

module.exports = errorHandler;
