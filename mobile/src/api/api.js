import axios from "axios";
import { tokenStorage } from "../storage/tokenStorage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TIMEOUT_MS = 30000;

const api = axios.create({ baseURL: API_URL, timeout: API_TIMEOUT_MS });

let onUnauthorized = null;
export const registerUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

let isRefreshing = false;
let refreshPromise = null;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach((p) => {
    if (error) p.reject(error);
    else {
      p.config.headers = {
        ...p.config.headers,
        Authorization: `Bearer ${token}`,
      };
      p.resolve(api(p.config));
    }
  });
  pendingQueue = [];
};

const performRefresh = async () => {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const { data } = await axios.post(
    `${API_URL}/auth/refresh`,
    { refreshToken },
    { timeout: API_TIMEOUT_MS },
  );

  await tokenStorage.setAccessToken(data.token);
  await tokenStorage.setRefreshToken(data.refreshToken);
  return data.token;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    if (
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/google") ||
      original.url?.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject, config: original });
      });
    }

    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const newToken = await performRefresh();
        processQueue(null, newToken);
        return newToken;
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenStorage.clear();
        if (onUnauthorized) onUnauthorized();
        throw refreshError;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    try {
      const newToken = await refreshPromise;
      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${newToken}`,
      };
      return api(original);
    } catch (err) {
      return Promise.reject(err);
    }
  },
);

export default api;
