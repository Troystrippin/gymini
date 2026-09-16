require("dotenv").config();
const mongoose = require("mongoose");
const WorkoutPlan = require("./models/WorkoutPlan");
const User = require("./models/User");
const Exercise = require("./models/Exercise");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to Mongo:", mongoose.connection.name);

    const users = await User.find({}).select("email _id");
    console.log("\n👥 Users:");
    users.forEach((u) => console.log("   -", u._id.toString(), "|", u.email));

    const exercises = await Exercise.find({});
    console.log("\n🏋️ Exercises:", exercises.length);
    exercises.forEach((e) =>
      console.log(
        "   -",
        e.name,
        "|",
        e.muscleGroup,
        "| isCustom:",
        e.isCustom,
      ),
    );

    const plans = await WorkoutPlan.find({});
    console.log("\n📋 WorkoutPlans:", plans.length);
    plans.forEach((p) =>
      console.log(
        "   -",
        p._id.toString(),
        "| user:",
        p.userId?.toString(),
        "| name:",
        p.name,
        "| exercises:",
        p.exercises?.length,
      ),
    );

    console.log("\n✅ Done");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err);
  }
})();