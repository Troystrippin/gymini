import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Logo from "../components/Logo";
import MealsIcon from "../icons/MealsIcon";
import ProfileIcon from "../icons/ProfileIcon";
import ProgressIcon from "../icons/ProgressIcon";
import WorkoutIcon from "../icons/WorkoutIcon";
import DashboardIcon from "../icons/DashboardIcon";
import { COLORS, ROLE_COLORS } from "../theme";

export default function Sidebar() {
  const { user, logout } = useAuth();

  const linkStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 18px",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    color: isActive ? COLORS.background : COLORS.text,
    background: isActive ? COLORS.primary : "transparent",
    marginBottom: 6,
    transition: "all 0.15s",
  });

  const iconProps = (isActive) => ({
    color: isActive ? COLORS.background : COLORS.text,
    size: 18,
  });

  return (
    <aside
      style={{
        width: 260,
        padding: "24px 18px",
        borderRight: `1px solid ${COLORS.border}`,
        background: COLORS.background,
        boxShadow: "4px 0px 12px rgba(0, 0, 0, 0.08)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Logo
            color={COLORS.text}
            width={25}
            height={25}
            style={{ display: "block" }}
          />
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>
            GYMINI
          </div>
        </div>

        <div
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            marginTop: 4,
            letterSpacing: 1,
          }}
        >
          ADMIN PANEL
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        <NavLink to="/dashboard" style={linkStyle}>
          {({ isActive }) => (
            <>
              <DashboardIcon {...iconProps(isActive)} />
              <span>Dashboard</span>
            </>
          )}
        </NavLink>
        <NavLink to="/users" style={linkStyle}>
          {({ isActive }) => (
            <>
              <ProfileIcon {...iconProps(isActive)} />
              <span>Users</span>
            </>
          )}
        </NavLink>
        <NavLink to="/analytics" style={linkStyle}>
          {({ isActive }) => (
            <>
              <ProgressIcon {...iconProps(isActive)} />
              <span>Analytics</span>
            </>
          )}
        </NavLink>
        <NavLink to="/exercises" style={linkStyle}>
          {({ isActive }) => (
            <>
              <WorkoutIcon {...iconProps(isActive)} />
              <span>Exercises</span>
            </>
          )}
        </NavLink>
        <NavLink to="/activity-logs" style={linkStyle}>
          {({ isActive }) => (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 3V7M17 3V7M4 11H20M5 5H19C20.1046 5 21 5.89543 21 7V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V7C3 5.89543 3.89543 5 5 5Z"
                  stroke={isActive ? COLORS.background : COLORS.text}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Activity Logs</span>
            </>
          )}
        </NavLink>
        <NavLink to="/meals" style={linkStyle}>
          {({ isActive }) => (
            <>
              <MealsIcon {...iconProps(isActive)} />
              <span>Meals</span>
            </>
          )}
        </NavLink>
      </nav>

      <div
        style={{
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: 16,
          marginTop: 16,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.fullName}</div>
        <div
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            marginTop: 2,
            marginBottom: 8,
          }}
        >
          {user?.email}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            padding: "3px 10px",
            borderRadius: 10,
            background: ROLE_COLORS[user?.role] || COLORS.textSecondary,
            color: "#FFF",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {user?.role}
        </span>
        <button
          onClick={logout}
          style={{
            display: "block",
            width: "100%",
            backgroundColor: COLORS.danger,
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: "transparent",
            color: COLORS.buttonText,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
