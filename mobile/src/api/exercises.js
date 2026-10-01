import api from "./api";

export const exercisesApi = {
  list: (params = {}) =>
    api.get("/exercises", { params }).then((r) => r.data),

  getById: (id) => api.get(`/exercises/${id}`).then((r) => r.data),

  create: ({
    name,
    muscleGroup,
    equipment,
    difficulty,
    description,
    mediaUrl,
  }) =>
    api
      .post("/exercises", {
        name,
        muscleGroup,
        equipment,
        difficulty,
        description,
        mediaUrl,
      })
      .then((r) => r.data),

  favorite: (exerciseId) =>
    api.post(`/exercises/${exerciseId}/favorite`).then((r) => r.data),

  unfavorite: (exerciseId) =>
    api.delete(`/exercises/${exerciseId}/favorite`).then((r) => r.data),

  favoriteStatus: (exerciseId) =>
    api.get(`/exercises/${exerciseId}/favorite`).then((r) => r.data),

  listFavorites: (page = 1, limit = 20) => {
    const params = {};
    const p = Number(page);
    const l = Number(limit);
    if (Number.isFinite(p) && p >= 1) params.page = p;
    if (Number.isFinite(l) && l >= 1) params.limit = Math.min(l, 50);
    return api
      .get("/exercises/favorites", { params })
      .then((r) => r.data);
  },
};