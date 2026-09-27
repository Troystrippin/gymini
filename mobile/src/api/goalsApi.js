import api from "./api";

export const goalsApi = {
  active: () => api.get("/goals/active").then((r) => r.data),
  create: ({ type, target, deadline }) =>
    api.post("/goals", { type, target, deadline }).then((r) => r.data),
  update: (id, { target, deadline }) =>
    api.patch(`/goals/${id}`, { target, deadline }).then((r) => r.data),
  abandon: (id) => api.delete(`/goals/${id}`).then((r) => r.data),
  milestones: () => api.get("/goals/milestones").then((r) => r.data),
};