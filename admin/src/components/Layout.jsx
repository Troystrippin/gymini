import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { COLORS } from "../theme";

export default function Layout() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: COLORS.background,
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: "32px 40px",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
