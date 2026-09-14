import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      if (token && storedUser) {
        const cachedUser = JSON.parse(storedUser);
        setUser(cachedUser);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

        try {
          const response = await api.get("/auth/me");
          await AsyncStorage.setItem("user", JSON.stringify(response.data));
          setUser(response.data);
        } catch (error) {
          await clearSession();
        }
      }

      setIsLoading(false);
    };

    loadUser();
  }, []);

  const register = async (fullName, email, password) => {
    const response = await api.post("/auth/register", {
      fullName,
      email,
      password,
    });
    const token = response.data.token;

    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(response.data));
    setUser(response.data);
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const token = response.data.token;

    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(response.data));
    setUser(response.data);
  };

  const logout = async () => {
    await clearSession();
  };

  const completeOnboarding = async (onboardingData) => {
    const response = await api.put("/auth/onboarding", onboardingData);
    const updatedUser = { ...user, ...response.data };
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, register, login, logout, completeOnboarding }}
    >
      {children}
    </AuthContext.Provider>
  );
};
