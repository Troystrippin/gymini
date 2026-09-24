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
const { handleValidation } = require("../middleware/validate");
const {
  planIdParam,
  savePlanRules,
} = require("../validators/planValidators");

router.post("/", protect, savePlanRules, handleValidation, savePlan);
router.get("/", protect, getPlans);
router.get("/:id", protect, planIdParam, handleValidation, getPlanById);
router.put(
  "/:id",
  protect,
  planIdParam,
  savePlanRules,
  handleValidation,
  savePlan,
);
router.put("/:id/select", protect, planIdParam, handleValidation, selectPlan);
router.delete("/:id", protect, planIdParam, handleValidation, deletePlan);

module.exports = router;