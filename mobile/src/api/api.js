import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({ baseURL: API_URL });

const applyAuthToken = async (config = {}) => {
  const token = await AsyncStorage.getItem("token");

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  } else {
    delete config.headers?.Authorization;
  }

  return config;
};

api.interceptors.request.use(async (config) => applyAuthToken(config));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      delete api.defaults.headers.common.Authorization;
    }
    return Promise.reject(error);
  },
);

export default api;
