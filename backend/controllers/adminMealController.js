const Meal = require("../models/Meal");
const { uploadImage, deleteImage } = require("../lib/cloudinary");
const { logAdminAction } = require("../utils/auditLog");
const crypto = require("crypto");

const listMeals = async (req, res, next) => {
  try {
    const meals = await Meal.find({}).sort({ type: 1, name: 1 }).lean();
    res.json({ meals });
  } catch (error) {
    next(error);
  }
};

const createMeal = async (req, res, next) => {
  let uploaded;
  try {
    const {
      name,
      type,
      goal,
      description,
      calories,
      protein,
      carbs,
      fats,
      tags,
    } = req.body;

    const mealId = crypto.randomBytes(8).toString("hex");

    if (req.file) {
      uploaded = await uploadImage(req.file.buffer, "gymini/meals");
    }

    const newMeal = await Meal.create({
      id: mealId,
      name,
      type,
      goal,
      description: description || "",
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      image: uploaded?.secure_url || "",
      imagePublicId: uploaded?.public_id || null,
      active: true,
    });

    await logAdminAction(req, {
      action: "meal.create",
      targetType: "meal",
      targetId: newMeal._id,
      targetLabel: newMeal.name,
    });

    res.status(201).json({ message: "Meal created", meal: newMeal });
  } catch (error) {
    if (uploaded?.public_id) {
      await deleteImage(uploaded.public_id).catch(() => {});
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid meal data",
        errors: Object.values(error.errors).map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }
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

module.exports = { listMeals, createMeal, updateMealImage, deleteMeal };
