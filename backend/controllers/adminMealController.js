const Meal = require("../models/Meal");
const { uploadImage, deleteImage } = require("../lib/cloudinary");
const { logAdminAction } = require("../utils/auditLog");

const listMeals = async (req, res, next) => {
  try {
    const meals = await Meal.find({}).sort({ type: 1, name: 1 }).lean();
    res.json({ meals });
  } catch (error) {
    next(error);
  }
};

const updateMealImage = async (req, res, next) => {
  let uploaded;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const meal = await Meal.findOne({ id: req.params.id });
    if (!meal) return res.status(404).json({ message: "Meal not found" });

    uploaded = await uploadImage(req.file.buffer, "gymini/meals");
    const previousPublicId = meal.imagePublicId;
    meal.image = uploaded.secure_url;
    meal.imagePublicId = uploaded.public_id;
    const updatedMeal = await meal.save();

    if (previousPublicId) {
      deleteImage(previousPublicId).catch((error) =>
        console.error(
          "[cloudinary] old meal image cleanup failed:",
          error.message,
        ),
      );
    }

    await logAdminAction(req, {
      action: "meal.image_update",
      targetType: "meal",
      targetId: meal._id,
      targetLabel: meal.name,
      metadata: { replacedExisting: Boolean(previousPublicId) },
    });

    res.json({ meal: updatedMeal });
  } catch (error) {
    if (uploaded?.public_id) {
      await deleteImage(uploaded.public_id).catch(() => {});
    }
    next(error);
  }
};

const deleteMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findOne({ id: req.params.id });
    if (!meal) return res.status(404).json({ message: "Meal not found" });

    await deleteImage(meal.imagePublicId);
    await meal.deleteOne();

    await logAdminAction(req, {
      action: "meal.delete",
      targetType: "meal",
      targetId: meal._id,
      targetLabel: meal.name,
    });

    res.json({ message: "Meal deleted", mealId: meal.id });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMeals, updateMealImage, deleteMeal };