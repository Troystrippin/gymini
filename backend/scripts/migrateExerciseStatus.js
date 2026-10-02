require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

const run = async () => {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set. Aborting.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const Exercise = mongoose.connection.collection("exercises");

    // ── 1. Built-in → approved ─────────────────────────────
    const builtinResult = await Exercise.updateMany(
      {
        isCustom: false,
        $or: [{ status: { $exists: false } }, { status: null }],
      },
      { $set: { status: "approved" } },
    );
    console.log(
      `✅ Backfilled ${builtinResult.modifiedCount} built-in exercises → approved`,
    );

    // ── 2. Custom → pending ────────────────────────────────
    const customResult = await Exercise.updateMany(
      {
        isCustom: true,
        $or: [{ status: { $exists: false } }, { status: null }],
      },
      { $set: { status: "pending" } },
    );
    console.log(
      `✅ Backfilled ${customResult.modifiedCount} custom exercises → pending\n`,
    );

    // ── 3. Final report ────────────────────────────────────
    const total = await Exercise.countDocuments();
    const approved = await Exercise.countDocuments({ status: "approved" });
    const pending = await Exercise.countDocuments({ status: "pending" });
    const rejected = await Exercise.countDocuments({ status: "rejected" });
    const missing = await Exercise.countDocuments({
      $or: [{ status: { $exists: false } }, { status: null }],
    });

    console.log("── Final state ──");
    console.log(`Total:     ${total}`);
    console.log(`Approved:  ${approved}`);
    console.log(`Pending:   ${pending}`);
    console.log(`Rejected:  ${rejected}`);
    console.log(`Missing:   ${missing} ${missing === 0 ? "✅" : "❌"}`);

    await mongoose.disconnect();
    console.log("\n✅ Done.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

run();