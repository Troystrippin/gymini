import React, { createContext, useContext, useState, useEffect } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const storedUser = localStorage.getItem("admin_user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("admin_user", JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });

    if (!["admin", "moderator"].includes(res.data.role)) {
      throw new Error(
        "Access denied. This dashboard is for administrators only.",
      );
    }

    localStorage.setItem("admin_token", res.data.token);
    localStorage.setItem("admin_user", JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
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