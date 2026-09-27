const WeightLog = require("../models/WeightLog");
const User = require("../models/User");

const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const isValidDateKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

// POST /api/weight  { weightKg, date?, note? }
// Upserts today's log and syncs user.details.weightKg.
exports.logWeight = async (req, res, next) => {
  try {
    const weightKg = Number(req.body.weightKg);
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 500) {
      return res.status(400).json({ message: "Weight must be 20–500 kg" });
    }

    const date = req.body.date || todayKey();
    if (!isValidDateKey(date)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const note = typeof req.body.note === "string" ? req.body.note : "";

    const log = await WeightLog.findOneAndUpdate(
      { userId: req.user._id, date },
      { userId: req.user._id, date, weightKg, note },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    // Keep user.details.weightKg in sync with the latest entry
    await User.findByIdAndUpdate(req.user._id, {
      "details.weightKg": weightKg,
    });

    res.json(log);
  } catch (err) {
    next(err);
  }
};

// GET /api/weight?days=30
exports.getWeightHistory = async (req, res, next) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceKey = (() => {
      const y = since.getFullYear();
      const m = String(since.getMonth() + 1).padStart(2, "0");
      const d = String(since.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    })();

    const logs = await WeightLog.find({
      userId: req.user._id,
      date: { $gte: sinceKey },
    })
      .sort({ date: 1 })
      .lean();

    res.json({ days, logs });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/weight/:id
exports.deleteWeightLog = async (req, res, next) => {
  try {
    const removed = await WeightLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!removed) return res.status(404).json({ message: "Log not found" });
    res.json({ message: "Deleted", _id: req.params.id });
  } catch (err) {
    next(err);
  }
};