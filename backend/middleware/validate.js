const { validationResult } = require("express-validator");

/**
 * Runs after a chain of express-validator checks.
 * If any failed, returns 400 with a normalized error shape.
 * Otherwise passes control to the next handler.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  return res.status(400).json({
    message: "Validation failed",
    errors: formatted,
  });
};

module.exports = { handleValidation };