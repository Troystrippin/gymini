import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { COLORS } from "../theme";

export default function Layout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: COLORS.background,
      }}
    >
      <Sidebar />
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}