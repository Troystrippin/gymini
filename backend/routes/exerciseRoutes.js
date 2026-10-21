const express = require("express");
const router = express.Router();

const {
  createExercise,
  getExercises,
  getExerciseById,
} = require("../controllers/exerciseController");

const {
  favoriteExercise,
  unfavoriteExercise,
  listFavorites,
  getFavoriteStatus,
  getFavoriteStatuses,
} = require("../controllers/favoriteController");

const { protect } = require("../middleware/authMiddleware");
const imageUpload = require("../middleware/imageUpload");
const { handleValidation } = require("../middleware/validate");
const {
  exerciseIdParam,
  createExerciseRules,
  listExercisesRules,
} = require("../validators/exerciseValidators");
const {
  favoriteStatusRules,
  favoriteExerciseIdParam,
  listFavoritesRules,
} = require("../validators/favoriteValidators");

router.get("/", listExercisesRules, handleValidation, getExercises);

router.post(
  "/",
  protect,
  imageUpload,
  createExerciseRules,
  handleValidation,
  createExercise,
);

router.get(
  "/favorites",
  protect,
  listFavoritesRules,
  handleValidation,
  listFavorites,
);

router.post(
  "/favorites/status",
  protect,
  favoriteStatusRules,
  handleValidation,
  getFavoriteStatuses,
);

router.post(
  "/:id/favorite",
  protect,
  favoriteExerciseIdParam,
  handleValidation,
  favoriteExercise,
);

router.delete(
  "/:id/favorite",
  protect,
  favoriteExerciseIdParam,
  handleValidation,
  unfavoriteExercise,
);

router.get(
  "/:id/favorite",
  protect,
  favoriteExerciseIdParam,
  handleValidation,
  getFavoriteStatus,
);

router.get("/:id", exerciseIdParam, handleValidation, getExerciseById);

module.exports = router;
