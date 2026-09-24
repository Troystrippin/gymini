const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/mealController");

const router = express.Router();

// All meal routes require auth
router.use(protect);

// Catalog + recommendations
router.get("/", ctrl.getMeals);
router.get("/recommendations", ctrl.getRecommendations);

// User's plan
router.get("/plan", ctrl.getMyPlan);
router.put("/plan", ctrl.saveMealPlan);
router.post("/plan/add", ctrl.addMealToPlan);
router.post("/plan/remove", ctrl.removeMealFromPlan);
router.post("/plan/repeat", ctrl.repeatPlan);

// Analytics (Phase 3 hooks)
router.get("/stats", ctrl.getMealStats);

module.exports = router;