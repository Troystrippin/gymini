const { param, query } = require("express-validator");

const favoriteExerciseIdParam = [
  param("id").isMongoId().withMessage("Invalid exercise id"),
];

const listFavoritesRules = [
  query("page")
    .optional({ checkFalsy: true, nullable: true })
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer")
    .toInt(),
  query("limit")
    .optional({ checkFalsy: true, nullable: true })
    .isInt({ min: 1, max: 50 })
    .withMessage("limit must be between 1 and 50")
    .toInt(),
];

module.exports = {
  favoriteExerciseIdParam,
  listFavoritesRules,
};