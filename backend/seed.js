const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();

const User = require("./models/User");
const Exercise = require("./models/Exercise");
const WorkoutPlan = require("./models/WorkoutPlan");

const SEED_EXERCISES = [
  {
    name: "Barbell Bench Press",
    muscleGroup: "Chest",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description:
      "Lie on a flat bench, lower the bar to mid-chest, press back up to full extension. Targets pecs, front delts, and triceps.",
  },
  {
    name: "Pull-Up",
    muscleGroup: "Back",
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    description:
      "Hang from a bar with an overhand grip, pull your chin above the bar, lower under control. Builds lats and biceps.",
  },
  {
    name: "Barbell Squat",
    muscleGroup: "Legs",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description:
      "Bar on upper back, squat until thighs are parallel to the floor, drive back up. Hits quads, glutes, and hamstrings.",
  },
  {
    name: "Dumbbell Shoulder Press",
    muscleGroup: "Shoulders",
    equipment: "Dumbbell",
    difficulty: "Beginner",
    description:
      "Press dumbbells overhead from shoulder height until arms are extended, lower with control. Targets delts and triceps.",
  },
  {
    name: "Plank",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    description:
      "Hold a straight-body position on forearms and toes, keeping hips level. Builds core and shoulder stability.",
  },
  {
    name: "Deadlift",
    muscleGroup: "Back",
    equipment: "Barbell",
    difficulty: "Advanced",
    description:
      "Hinge at the hips to lift a loaded bar from the floor to standing, keeping the back flat throughout. Full posterior chain.",
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected");

    const user = await User.findOne({ email: "oytr680@gmail.com" });
    if (!user) throw new Error("User not found");
    console.log("👤 User:", user._id, user.email);

    await WorkoutPlan.deleteMany({ userId: user._id });
    console.log("🧹 Cleared old plans");

    const wipe = await Exercise.deleteMany({ isCustom: false });
    console.log(`🧹 Cleared ${wipe.deletedCount} old global exercises`);

    const inserted = await Exercise.insertMany(
      SEED_EXERCISES.map((e) => ({
        ...e,
        isCustom: false,
        createdBy: null,
      })),
    );
    console.log(`🏋️ Inserted ${inserted.length} exercises`);

    const squat = inserted.find((e) => e.name === "Barbell Squat");
    const bench = inserted.find((e) => e.name === "Barbell Bench Press");
    const deadlift = inserted.find((e) => e.name === "Deadlift");

    const plan = await WorkoutPlan.create({
      userId: user._id,
      name: "Leg Day",
      exercises: [
        {
          exerciseId: squat._id,
          name: squat.name,
          muscleGroup: squat.muscleGroup,
          description: squat.description,
          isCustom: false,
          sets: 4,
          reps: 8,
          completed: false,
          order: 0,
        },
        {
          exerciseId: deadlift._id,
          name: deadlift.name,
          muscleGroup: deadlift.muscleGroup,
          description: deadlift.description,
          isCustom: false,
          sets: 3,
          reps: 5,
          completed: false,
          order: 1,
        },
        {
          exerciseId: bench._id,
          name: bench.name,
          muscleGroup: bench.muscleGroup,
          description: bench.description,
          isCustom: false,
          sets: 3,
          reps: 10,
          completed: false,
          order: 2,
        },
      ],
    });

    console.log("📋 Created plan:", plan._id, "|", plan.name);
    console.log("✅ SEED COMPLETE");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ SEED FAILED:", err.message);
    console.error(err);
    process.exit(1);
  }
};

seed();