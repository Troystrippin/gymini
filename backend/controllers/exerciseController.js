const Exercise = require("../models/Exercise");

// GET /api/exercises?search=&muscleGroup=
const getExercises = async (req, res) => {
  try {
    const { search, muscleGroup } = req.query;

    const filter = {
      $or: [{ isCustom: false }, { createdBy: req.user._id }],
    };

    if (muscleGroup && muscleGroup !== "All") {
      filter.muscleGroup = muscleGroup;
    }
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const exercises = await Exercise.find(filter).sort({ name: 1 });
    res.json(exercises);
  } catch (err) {
    console.error("getExercises:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/exercises
const createExercise = async (req, res) => {
  try {
    const { name, muscleGroup, equipment, difficulty, description, mediaUrl } =
      req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Exercise name is required" });
    }
    if (!muscleGroup) {
      return res.status(400).json({ message: "Muscle group is required" });
    }

    const exercise = await Exercise.create({
      name: name.trim(),
      muscleGroup,
      equipment: equipment || "Bodyweight",
      difficulty: difficulty || "Beginner",
      description: description || "",
      mediaUrl: mediaUrl || null,
      isCustom: true,
      createdBy: req.user._id,
    });

    res.status(201).json(exercise);
  } catch (err) {
    console.error("createExercise:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/exercises/:id
const deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    if (
      !exercise.isCustom ||
      String(exercise.createdBy) !== String(req.user._id)
    ) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this exercise" });
    }
    await exercise.deleteOne();
    res.json({ message: "Exercise deleted" });
  } catch (err) {
    console.error("deleteExercise:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getExercises, createExercise, deleteExercise };