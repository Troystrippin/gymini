import api from "./api";

export const mealApi = {
  list: (params = {}) => api.get("/meals", { params }).then((r) => r.data),
  recommendations: () =>
    api.get("/meals/recommendations").then((r) => r.data),
  getPlan: (date) =>
    api.get("/meals/plan", { params: { date } }).then((r) => r.data),
  savePlan: (entries, date) =>
    api.put("/meals/plan", { entries, date }).then((r) => r.data),
  addMeal: (mealId, date) =>
    api.post("/meals/plan/add", { mealId, date }).then((r) => r.data),
  removeMeal: (mealId, date) =>
    api.post("/meals/plan/remove", { mealId, date }).then((r) => r.data),
  repeatPlan: (fromDate, toDate) =>
    api
      .post("/meals/plan/repeat", { fromDate, toDate })
      .then((r) => r.data),
  stats: (from, to) =>
    api.get("/meals/stats", { params: { from, to } }).then((r) => r.data),
};