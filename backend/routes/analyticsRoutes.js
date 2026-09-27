const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/analyticsController");

const router = express.Router();

router.use(protect);

router.get("/progress", ctrl.getProgressAnalytics);
router.get("/home", ctrl.getHomeAnalytics);

module.exports = router;