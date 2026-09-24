import React, { createContext, useContext, useState, useEffect } from "react";
import api from "./api";

const AuthContext = createContext(null);

const ALLOWED_ROLES = ["admin", "moderator"];

function persistSession(data) {
  localStorage.setItem("admin_token", data.token);
  if (data.refreshToken) {
    localStorage.setItem("admin_refresh_token", data.refreshToken);
  }
  localStorage.setItem("admin_user", JSON.stringify(data));
}

function clearSession() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_refresh_token");
  localStorage.removeItem("admin_user");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const storedUser = localStorage.getItem("admin_user");

    if (!token || !storedUser) {
      setLoading(false);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(storedUser);
    } catch {
      clearSession();
      setLoading(false);
      return;
    }

    setUser(parsed);

    api
      .get("/auth/me")
      .then((res) => {
        if (!ALLOWED_ROLES.includes(res.data.role)) {
          clearSession();
          setUser(null);
          return;
        }
        const merged = { ...parsed, ...res.data };
        setUser(merged);
        localStorage.setItem("admin_user", JSON.stringify(merged));
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });

    if (!ALLOWED_ROLES.includes(res.data.role)) {
      throw new Error(
        "Access denied. This dashboard is for administrators only.",
      );
    }

    persistSession(res.data);
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("admin_refresh_token");
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } catch {
      // ignore — session is cleared locally regardless
    }
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}