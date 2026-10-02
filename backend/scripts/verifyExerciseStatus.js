require("dotenv").config();
const mongoose = require("mongoose");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const Exercise = mongoose.connection.collection("exercises");

    const total = await Exercise.countDocuments();
    const missing = await Exercise.countDocuments({
      $or: [{ status: { $exists: false } }, { status: null }],
    });

    console.log(`Total exercises:    ${total}`);
    console.log(`Missing status:     ${missing}\n`);

    const byStatus = await Exercise.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray();

    console.log("Breakdown by status:");
    if (byStatus.length === 0) {
      console.log("  (no documents)");
    } else {
      byStatus.forEach((s) =>
        console.log(`  ${s._id ?? "(missing)"}: ${s.count}`),
      );
    }
    console.log();

    const byType = await Exercise.aggregate([
      {
        $group: {
          _id: { isCustom: "$isCustom", status: "$status" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.isCustom": 1, "_id.status": 1 } },
    ]).toArray();

    console.log("Custom vs built-in breakdown:");
    if (byType.length === 0) {
      console.log("  (no documents)");
    } else {
      byType.forEach((s) =>
        console.log(
          `  isCustom=${s._id.isCustom} status=${
            s._id.status ?? "missing"
          }: ${s.count}`,
        ),
      );
    }

    await mongoose.disconnect();
    console.log("\n✅ Done.");
  } catch (err) {
    console.error("❌ verifyExerciseStatus failed:", err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

run();