import api from "./api";

export const weightApi = {
  log: (weightKg, note = "") =>
    api.post("/weight", { weightKg, note }).then((r) => r.data),
  history: (days = 30) =>
    api.get("/weight", { params: { days } }).then((r) => r.data),
  remove: (id) => api.delete(`/weight/${id}`).then((r) => r.data),
};