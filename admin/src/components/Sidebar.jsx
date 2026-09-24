import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { COLORS, ROLE_COLORS } from "../theme";

export default function Sidebar() {
  const { user, logout } = useAuth();

  const linkStyle = ({ isActive }) => ({
    display: "block",
    padding: "12px 18px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    color: isActive ? COLORS.background : COLORS.text,
    background: isActive ? COLORS.primary : "transparent",
    marginBottom: 6,
    transition: "all 0.15s",
  });

  return (
    <aside
      style={{
        width: 260,
        padding: "24px 18px",
        borderRight: `1px solid ${COLORS.border}`,
        background: COLORS.background,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>
          ◆◆ GYMINI
        </div>
        <div
          style={{
            fontSize: 11,
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
          📊 Dashboard
        </NavLink>
        <NavLink to="/users" style={linkStyle}>
          👥 Users
        </NavLink>
      </nav>

      <div
        style={{
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: 16,
          marginTop: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.fullName}</div>
        <div
          style={{
            fontSize: 11,
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
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: "transparent",
            color: COLORS.text,
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