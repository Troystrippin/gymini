import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("admin_refresh_token");
  if (!refreshToken) throw new Error("No refresh token");

  const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  const { token, refreshToken: newRefresh } = res.data;

  localStorage.setItem("admin_token", token);
  if (newRefresh) localStorage.setItem("admin_refresh_token", newRefresh);
  return token;
}

function clearSession() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_refresh_token");
  localStorage.removeItem("admin_user");
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthError = err.response?.status === 401;
    const alreadyRetried = original?._retry;
    const isRefreshCall = original?.url?.includes("/auth/refresh");
    const isLoginCall = original?.url?.includes("/auth/login");

    if (isAuthError && !alreadyRetried && !isRefreshCall && !isLoginCall) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = refreshAccessToken().finally(() => {
            refreshing = null;
          });
        }
        const newToken = await refreshing;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        clearSession();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      }
    }

    if (isAuthError && !isLoginCall) {
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  },
);

export default api;
export { API_URL };