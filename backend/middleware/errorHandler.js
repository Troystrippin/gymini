const errorHandler = (err, req, res, next) => {
  console.error("[error]", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Image must be 5 MB or smaller" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid id format" });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate key" });
  }

  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === "production";
  res.status(status).json({
    message: isProd && status === 500 ? "Internal server error" : err.message,
  });
};

const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

module.exports = { errorHandler, notFound };
