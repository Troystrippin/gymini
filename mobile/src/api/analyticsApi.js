import api from "./api";

export const analyticsApi = {
  progress: () => api.get("/analytics/progress").then((r) => r.data),
  home: () => api.get("/analytics/home").then((r) => r.data),
};