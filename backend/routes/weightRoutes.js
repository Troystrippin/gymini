const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/weightController");

const router = express.Router();

router.use(protect);

router.post("/", ctrl.logWeight);
router.get("/", ctrl.getWeightHistory);
router.delete("/:id", ctrl.deleteWeightLog);

module.exports = router;