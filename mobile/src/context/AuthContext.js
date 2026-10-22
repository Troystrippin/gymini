import React, { createContext, useState, useEffect, useCallback } from "react";
import api, { registerUnauthorizedHandler } from "../api/api";
import { tokenStorage } from "../storage/tokenStorage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSession = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(async () => {
      await clearSession();
      setSessionExpired(true);
    });
  }, [clearSession]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        const storedUser = await tokenStorage.getUser();

        if (!token || !storedUser) return;

        setUser(storedUser);

        try {
          const response = await api.get("/auth/me");
          await tokenStorage.setUser(response.data);
          setUser(response.data);
        } catch (err) {
          const status = err.response?.status;
          if (status === 401) return;
          console.warn(
            "Session refresh failed (non-401), keeping cache:",
            err.message,
          );
        }
      } catch (err) {
        console.warn("Failed to load stored session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const persistSession = async (data) => {
    await tokenStorage.setAccessToken(data.token);
    await tokenStorage.setRefreshToken(data.refreshToken);
    const { token, refreshToken, ...userWithoutTokens } = data;
    await tokenStorage.setUser(userWithoutTokens);
    setUser(userWithoutTokens);
  };

  const register = async (fullName, email, password) => {
    const response = await api.post("/auth/register", {
      fullName,
      email,
      password,
    });
    // Do NOT persist session. Backend doesn't return tokens.
    return response.data;
  };

  const verifyEmail = async (email, code) => {
    // Pass email because user is not logged in yet
    const response = await api.post("/auth/verify-email", { email, code });
    
    // Backend returns tokens on success, so log them in!
    if (response.data.token) {
      await persistSession(response.data);
    }
    
    setSessionExpired(false);
    return response.data;
  };

  const googleLogin = async (idToken) => {
    const response = await api.post("/auth/google", { idToken });
    await persistSession(response.data);
    setSessionExpired(false);
    return response.data;
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    await persistSession(response.data);
    setSessionExpired(false);
  };

  const logout = async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken }).catch(() => {});
      }
    } finally {
      await clearSession();
      setSessionExpired(false);
    }
  };

  const completeOnboarding = async (onboardingData) => {
    const response = await api.put("/auth/onboarding", onboardingData);
    const updatedUser = { ...user, ...response.data };
    await tokenStorage.setUser(updatedUser);
    setUser(updatedUser);
    return response.data;
  };

  const resendVerification = async (email) => {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
  };

  const forgotPassword = async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  };

  const resetPassword = async (email, code, newPassword) => {
    const response = await api.post("/auth/reset-password", {
      email,
      code,
      newPassword,
    });
    return response.data;
  };

  const refreshUser = async () => {
    const response = await api.get("/auth/me");
    await tokenStorage.setUser(response.data);
    setUser(response.data);
    return response.data;
  };

  const updateProfile = async (fields) => {
    const response = await api.put("/auth/profile", fields);
    const updatedUser = { ...user, ...response.data };
    await tokenStorage.setUser(updatedUser);
    setUser(updatedUser);
    return response.data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const response = await api.put("/auth/change-password", {
      currentPassword,
      newPassword,
    });

    if (response.data.token) {
      await tokenStorage.setAccessToken(response.data.token);
      await tokenStorage.setRefreshToken(response.data.refreshToken);
    }
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        sessionExpired,
        register,
        login,
        googleLogin,
        logout,
        completeOnboarding,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        refreshUser,
        updateProfile,
        changePassword,
        clearSessionExpired: () => setSessionExpired(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};