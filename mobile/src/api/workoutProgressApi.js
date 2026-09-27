import api from "./api";

export const workoutProgressApi = {
  get: (planId, date) =>
    api
      .get("/workouts/progress", { params: { planId, date } })
      .then((r) => r.data),
  save: ({ planId, date, completedExerciseIds, setResults }) =>
    api
      .put("/workouts/progress", {
        planId,
        date,
        completedExerciseIds,
        setResults,
      })
      .then((r) => r.data),
};

export const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};