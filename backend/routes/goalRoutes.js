const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/goalController");

const router = express.Router();

router.use(protect);

router.post("/", ctrl.createGoal);
router.get("/active", ctrl.getActiveGoal);
router.get("/milestones", ctrl.getMilestones);
router.patch("/:id", ctrl.updateGoal);
router.delete("/:id", ctrl.abandonGoal);

module.exports = router;