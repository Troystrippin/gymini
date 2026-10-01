const mongoose = require("mongoose");
const FavoriteExercise = require("../models/FavoriteExercise");
const Exercise = require("../models/Exercise");

// Cap per user — prevents unbounded growth.
const MAX_FAVORITES_PER_USER = 500;

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Loads an exercise and enforces the visibility rule:
 *   - built-in exercises (isCustom: false) are favoritable by anyone
 *   - custom exercises are only favoritable by their creator
 *
 * Returns { exercise } on success, or { error: { status, message } }.
 */
const loadFavoritableExercise = async (exerciseId, userId) => {
  const exercise = await Exercise.findById(exerciseId).lean();
  if (!exercise) {
    return { error: { status: 404, message: "Exercise not found" } };
  }

  if (exercise.isCustom && String(exercise.createdBy) !== String(userId)) {
    return {
      error: {
        status: 403,
        message: "You can only favorite custom exercises you created",
      },
    };
  }

  return { exercise };
};

// ─── POST /api/exercises/:id/favorite ────────────────────────────
// Idempotent: favoriting twice is a success, not an error.
const favoriteExercise = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await loadFavoritableExercise(id, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    // Enforce per-user cap only if this is a NEW favorite.
    const existing = await FavoriteExercise.findOne({
      userId: req.user._id,
      exerciseId: id,
    }).lean();

    if (!existing) {
      const count = await FavoriteExercise.countDocuments({
        userId: req.user._id,
      });
      if (count >= MAX_FAVORITES_PER_USER) {
        return res.status(400).json({
          message: `Favorites limit reached (${MAX_FAVORITES_PER_USER}). Remove some before adding more.`,
        });
      }
    }

    // Upsert — races resolve via the unique index; duplicate error
    // is treated as success because the desired end-state is achieved.
    let favorite;
    try {
      favorite = await FavoriteExercise.findOneAndUpdate(
        { userId: req.user._id, exerciseId: id },
        { $setOnInsert: { userId: req.user._id, exerciseId: id } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).lean();
    } catch (err) {
      if (err.code === 11000) {
        favorite = await FavoriteExercise.findOne({
          userId: req.user._id,
          exerciseId: id,
        }).lean();
      } else {
        throw err;
      }
    }

    res.status(201).json({
      favorited: true,
      exerciseId: String(id),
      createdAt: favorite?.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/exercises/:id/favorite ──────────────────────────
// Idempotent: unfavoriting something that isn't favorited is success.
const unfavoriteExercise = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate id shape early so a malformed id returns 400 not 500.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    await FavoriteExercise.findOneAndDelete({
      userId: req.user._id,
      exerciseId: id,
    });

    res.json({ favorited: false, exerciseId: String(id) });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/exercises/favorites?page=1&limit=20 ────────────────
const listFavorites = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const page = Math.max(1, Number(req.query.page) || 1);
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      FavoriteExercise.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "exerciseId",
          select: "name muscleGroup equipment difficulty isCustom createdBy",
        })
        .lean(),
      FavoriteExercise.countDocuments({ userId: req.user._id }),
    ]);

    // Filter out favorites whose exercise has been deleted since,
    // and hide custom exercises the user no longer owns (edge case:
    // creator changed). Keeps response shape clean.
    const items = favorites
      .filter((f) => f.exerciseId)
      .filter(
        (f) =>
          !f.exerciseId.isCustom ||
          String(f.exerciseId.createdBy) === String(req.user._id),
      )
      .map((f) => ({
        _id: f._id,
        favoritedAt: f.createdAt,
        exercise: {
          _id: f.exerciseId._id,
          name: f.exerciseId.name,
          muscleGroup: f.exerciseId.muscleGroup,
          equipment: f.exerciseId.equipment,
          difficulty: f.exerciseId.difficulty,
          isCustom: f.exerciseId.isCustom,
        },
      }));

    res.json({
      favorites: items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/exercises/:id/favorite ─────────────────────────────
// Lightweight status check for the star icon.
const getFavoriteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const exists = await FavoriteExercise.exists({
      userId: req.user._id,
      exerciseId: id,
    });

    res.json({ favorited: Boolean(exists) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  favoriteExercise,
  unfavoriteExercise,
  listFavorites,
  getFavoriteStatus,
  MAX_FAVORITES_PER_USER,
};