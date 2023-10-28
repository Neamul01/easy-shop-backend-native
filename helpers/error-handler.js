function errorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    // jwt auth error
    return res.status(500).json({ message: "User is not authorized" });
  }

  if (err.name === "ValidationError") {
    // validation error
    return res.status(500).json({ message: err });
  }

  //   default 500 server error
  return res.status(500).json(err);
}

module.exports = errorHandler;
