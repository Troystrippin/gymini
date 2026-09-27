// One-off: remove duplicate WorkoutLog documents sharing
// (userId, planId, day). Keeps the earliest, deletes the rest.

require("dotenv").config();
const mongoose = require("mongoose");
const WorkoutLog = require("../models/WorkoutLog");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");

  const all = await WorkoutLog.find({}).sort({ dateCompleted: 1 }).lean();
  console.log(`Scanning ${all.length} logs`);

  const seen = new Map();
  const toDelete = [];

  for (const log of all) {
    const d = new Date(log.dateCompleted);
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const key = `${log.userId}|${log.planId}|${dayKey}`;

    if (seen.has(key)) {
      toDelete.push(log._id);
    } else {
      seen.set(key, log._id);
    }
  }

  console.log(`Found ${toDelete.length} duplicate logs`);
  if (toDelete.length) {
    const r = await WorkoutLog.deleteMany({ _id: { $in: toDelete } });
    console.log(`Deleted ${r.deletedCount}`);
  }

  await mongoose.disconnect();
  console.log("Done");
})().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});