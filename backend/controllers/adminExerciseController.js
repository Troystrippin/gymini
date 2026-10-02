const mongoose = require("mongoose");
const Exercise = require("../models/Exercise");
const WorkoutPlan = require("../models/WorkoutPlan");
const FavoriteExercise = require("../models/FavoriteExercise");
const { uploadImage, deleteImage } = require("../lib/cloudinary");

const MAX_LIMIT = 100;
const MAX_SKIP = 10000;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/admin/exercises
const listExercises = async (req, res, next) => {
  try {
    const {
      status,
      type,
      muscleGroup,
      search,
      page: rawPage = 1,
      limit: rawLimit = 50,
    } = req.query;

    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(rawLimit) || 50));
    const page = Math.max(1, Number(rawPage) || 1);
    const skip = Math.min(MAX_SKIP, (page - 1) * limit);

    const filter = {};
    if (status === "approved") {
      filter.status = { $in: ["approved", null] };
    } else if (status && ["pending", "rejected"].includes(status)) {
      filter.status = status;
    }
    if (type === "builtin") filter.isCustom = false;
    if (type === "custom") filter.isCustom = true;
    if (muscleGroup) filter.muscleGroup = muscleGroup;
    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: "i" };
    }

    const [exercises, total] = await Promise.all([
      Exercise.find(filter)
        .populate("createdBy", "fullName email")
        .populate("moderatedBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Exercise.countDocuments(filter),
    ]);

    res.json({ exercises, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/exercises/stats
const getExerciseStats = async (req, res, next) => {
  try {
    const [total, builtin, custom, pending, approved, rejected] =
      await Promise.all([
        Exercise.countDocuments(),
        Exercise.countDocuments({ isCustom: false }),
        Exercise.countDocuments({ isCustom: true }),
        Exercise.countDocuments({ status: "pending" }),
        Exercise.countDocuments({
          $or: [{ status: "approved" }, { status: null }],
        }),
        Exercise.countDocuments({ status: "rejected" }),
      ]);

    res.json({ total, builtin, custom, pending, approved, rejected });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/exercises/:id
const getExerciseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const exercise = await Exercise.findById(id)
      .populate("createdBy", "fullName email role")
      .populate("moderatedBy", "fullName email")
      .lean();

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    const [favoriteCount, planUsageCount] = await Promise.all([
      FavoriteExercise.countDocuments({ exerciseId: id }),
      WorkoutPlan.countDocuments({ "exercises.exerciseId": id }),
    ]);

    res.json({ exercise, stats: { favoriteCount, planUsageCount } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/exercises/:id/approve
const approveExercise = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const exercise = await Exercise.findByIdAndUpdate(
      id,
      {
        status: "approved",
        rejectionReason: null,
        moderatedBy: req.user._id,
        moderatedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    console.log(
      `[admin] ${req.user.email} approved exercise=${exercise._id} "${exercise.name}"`,
    );
    res.json({ message: "Exercise approved", exercise });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/exercises/:id/reject
const rejectExercise = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim() : "";

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const exercise = await Exercise.findByIdAndUpdate(
      id,
      {
        status: "rejected",
        rejectionReason: reason || "No reason provided",
        moderatedBy: req.user._id,
        moderatedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    console.log(
      `[admin] ${req.user.email} rejected exercise=${exercise._id} reason="${reason}"`,
    );
    res.json({ message: "Exercise rejected", exercise });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/exercises/:id
const updateExercise = async (req, res, next) => {
  let uploadedImage;
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const allowed = [
      "name",
      "muscleGroup",
      "equipment",
      "difficulty",
      "description",
      "mediaUrl",
    ];
    const update = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });
    if (req.file) {
      uploadedImage = await uploadImage(req.file.buffer, "gymini/exercises");
      update.mediaUrl = uploadedImage.secure_url;
      update.mediaPublicId = uploadedImage.public_id;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const previousImage = req.file
      ? await Exercise.findById(id).select("mediaPublicId").lean()
      : null;
    const exercise = await Exercise.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!exercise) {
      if (uploadedImage?.public_id) await deleteImage(uploadedImage.public_id);
      return res.status(404).json({ message: "Exercise not found" });
    }

    if (previousImage?.mediaPublicId) {
      deleteImage(previousImage.mediaPublicId).catch((error) =>
        console.error(
          "[cloudinary] old exercise image cleanup failed:",
          error.message,
        ),
      );
    }

    console.log(`[admin] ${req.user.email} updated exercise=${exercise._id}`);
    res.json({ message: "Exercise updated", exercise });
  } catch (err) {
    if (uploadedImage?.public_id) {
      await deleteImage(uploadedImage.public_id).catch(() => {});
    }
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

// DELETE /api/admin/exercises/:id
const deleteExercise = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    if (!exercise.isCustom && req.query.confirm !== "true") {
      return res.status(400).json({
        message:
          "Built-in exercise deletion requires ?confirm=true. Cannot be undone.",
      });
    }

    await deleteImage(exercise.mediaPublicId);

    await Promise.all([
      Exercise.deleteOne({ _id: id }),
      FavoriteExercise.deleteMany({ exerciseId: id }),
      WorkoutPlan.updateMany(
        { "exercises.exerciseId": id },
        { $set: { "exercises.$[el].exerciseId": null } },
        { arrayFilters: [{ "el.exerciseId": id }] },
      ),
    ]);

    console.log(
      `[admin] ${req.user.email} deleted exercise=${id} "${exercise.name}" isCustom=${exercise.isCustom}`,
    );
    res.json({ message: "Exercise deleted", exerciseId: id });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listExercises,
  getExerciseStats,
  getExerciseById,
  approveExercise,
  rejectExercise,
  updateExercise,
  deleteExercise,
};
