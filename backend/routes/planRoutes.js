const express = require("express");
const router = express.Router();
const {
  savePlan,
  getPlans,
  getPlanById,
  deletePlan,
  selectPlan,
} = require("../controllers/planController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, savePlan);
router.get("/", protect, getPlans);
router.get("/:id", protect, getPlanById);
router.put("/:id", protect, savePlan);
router.put("/:id/select", protect, selectPlan);
router.delete("/:id", protect, deletePlan);

module.exports = router;
