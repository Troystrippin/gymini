const Exercise = require("../models/Exercise");

// ─────────────────────────────────────────────────────────────
// POST /api/exercises
// Body: { name, muscleGroup, equipment?, difficulty?, description?, mediaUrl? }
// Auth: required
// ─────────────────────────────────────────────────────────────
const createExercise = async (req, res, next) => {
  try {
    const {
      name,
      muscleGroup,
      equipment,
      difficulty,
      description,
      mediaUrl,
    } = req.body;

    // Prevent duplicate custom exercises from the same user
    const existing = await Exercise.findOne({
      name: name.trim(),
      muscleGroup,
      createdBy: req.user._id,
    });
    if (existing) {
      return res.status(409).json({
        message: "You already created an exercise with that name and muscle group",
        exercise: existing,
      });
    }

    const exercise = await Exercise.create({
      name: name.trim(),
      muscleGroup,
      equipment: equipment?.trim() || "Bodyweight",
      difficulty: difficulty || "Beginner",
      description: description?.trim() || "",
      mediaUrl: mediaUrl || null,
      isCustom: true,
      createdBy: req.user._id,
    });

    res.status(201).json(exercise);
  } catch (err) {
    // Mongoose duplicate-key / validation errors
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid exercise data",
        errors: Object.values(err.errors).map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/exercises
// Query: { muscleGroup?, difficulty?, search?, limit?, skip? }
// Auth: not required (catalog is public for browsing)
// Returns: BARE ARRAY of exercises
// ─────────────────────────────────────────────────────────────
const getExercises = async (req, res, next) => {
  try {
    const {
      muscleGroup,
      difficulty,
      search,
      limit = 100,
      skip = 0,
    } = req.query;

    const filter = {};
    if (muscleGroup) filter.muscleGroup = muscleGroup;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.name = { $regex: search, $options: "i" };

    const exercises = await Exercise.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(exercises);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/exercises/:id
// Auth: not required
// ─────────────────────────────────────────────────────────────
const getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id).lean();
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    res.json(exercise);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/exercises/:id  (optional — edit custom exercise)
// Auth: required, must be creator
// ─────────────────────────────────────────────────────────────
const updateExercise = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    if (!exercise.isCustom) {
      return res
        .status(403)
        .json({ message: "Cannot edit built-in exercises" });
    }
    if (String(exercise.createdBy) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this exercise" });
    }

    const allowed = [
      "name",
      "muscleGroup",
      "equipment",
      "difficulty",
      "description",
      "mediaUrl",
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        exercise[field] = req.body[field];
      }
    });

    const updated = await exercise.save();
    res.json(updated);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid exercise data",
        errors: Object.values(err.errors).map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/exercises/:id  (optional — delete custom exercise)
// Auth: required, must be creator
// ─────────────────────────────────────────────────────────────
const deleteExercise = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    if (!exercise.isCustom) {
      return res
        .status(403)
        .json({ message: "Cannot delete built-in exercises" });
    }
    if (String(exercise.createdBy) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this exercise" });
    }

    await exercise.deleteOne();
    res.json({ message: "Exercise deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createExercise,
  getExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
};