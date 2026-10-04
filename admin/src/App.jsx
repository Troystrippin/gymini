import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import Analytics from "./pages/Analytics";
import Exercises from "./pages/Exercises";
import ExerciseDetail from "./pages/ExerciseDetail";
import ActivityLogs from "./pages/ActivityLogs";
import Meals from "./pages/Meals";

const ALLOWED_ROLES = ["admin"];

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          color: "#9A9A9A",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!ALLOWED_ROLES.includes(user.role))
    return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="exercises" element={<Exercises />} />
            <Route path="exercises/:id" element={<ExerciseDetail />} />
            <Route path="activity-logs" element={<ActivityLogs />} />
            <Route path="meals" element={<Meals />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}