const Exercise = require("../models/Exercise");

const escapeRegex = (s) =>
  String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /api/exercises — creates a custom exercise (pending review)
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

    const existing = await Exercise.findOne({
      name: name.trim(),
      muscleGroup,
      createdBy: req.user._id,
    });
    if (existing) {
      return res.status(409).json({
        message:
          "You already created an exercise with that name and muscle group",
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
      status: "pending",
    });

    res.status(201).json(exercise);
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

// GET /api/exercises
const getExercises = async (req, res, next) => {
  try {
    const {
      muscleGroup,
      difficulty,
      search,
      limit = 100,
      skip = 0,
    } = req.query;

    const or = [
      { isCustom: false, status: "approved" },
      { isCustom: true, status: "approved" },
    ];
    if (req.user) {
      or.push({ isCustom: true, createdBy: req.user._id });
    }

    const and = [{ $or: or }];
    if (muscleGroup) and.push({ muscleGroup });
    if (difficulty) and.push({ difficulty });
    if (search) {
      and.push({ name: { $regex: escapeRegex(search), $options: "i" } });
    }

    const exercises = await Exercise.find({ $and: and })
      .sort({ name: 1 })
      .skip(Math.max(0, Number(skip) || 0))
      .limit(Math.min(100, Math.max(1, Number(limit) || 100)))
      .lean();

    res.json(exercises);
  } catch (err) {
    next(err);
  }
};

// GET /api/exercises/:id
const getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id).lean();
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    if (
      exercise.isCustom &&
      exercise.status !== "approved" &&
      String(exercise.createdBy) !== String(req.user?._id || "")
    ) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    res.json(exercise);
  } catch (err) {
    next(err);
  }
};

// PUT /api/exercises/:id
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
      if (req.body[field] !== undefined) exercise[field] = req.body[field];
    });

    // Any edit re-opens moderation
    exercise.status = "pending";
    exercise.rejectionReason = null;
    exercise.moderatedBy = null;
    exercise.moderatedAt = null;

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

// DELETE /api/exercises/:id
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