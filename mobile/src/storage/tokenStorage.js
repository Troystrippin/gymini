import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "gymini_access_token";
const REFRESH_TOKEN_KEY = "gymini_refresh_token";
const USER_KEY = "gymini_user";

let secureStoreAvailable = null;

const canUseSecureStore = async () => {
  if (secureStoreAvailable !== null) return secureStoreAvailable;
  try {
    await SecureStore.setItemAsync("__probe__", "1");
    await SecureStore.deleteItemAsync("__probe__");
    secureStoreAvailable = true;
  } catch {
    secureStoreAvailable = false;
  }
  return secureStoreAvailable;
};

const setItem = async (key, value) => {
  if (await canUseSecureStore()) return SecureStore.setItemAsync(key, value);
  return AsyncStorage.setItem(key, value);
};

const getItem = async (key) => {
  if (await canUseSecureStore()) return SecureStore.getItemAsync(key);
  return AsyncStorage.getItem(key);
};

const removeItem = async (key) => {
  if (await canUseSecureStore()) return SecureStore.deleteItemAsync(key);
  return AsyncStorage.removeItem(key);
};

export const tokenStorage = {
  async getAccessToken() {
    return getItem(ACCESS_TOKEN_KEY);
  },
  async setAccessToken(token) {
    return setItem(ACCESS_TOKEN_KEY, token);
  },

  async getRefreshToken() {
    return getItem(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token) {
    return setItem(REFRESH_TOKEN_KEY, token);
  },

  async getUser() {
    const raw = await getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  async setUser(user) {
    return setItem(USER_KEY, JSON.stringify(user));
  },

  async clear() {
    await Promise.all([
      removeItem(ACCESS_TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
      removeItem(USER_KEY),
    ]);
  },
};