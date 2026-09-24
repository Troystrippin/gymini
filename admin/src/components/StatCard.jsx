import React from "react";
import { COLORS } from "../theme";

export default function StatCard({
  label,
  value,
  emoji,
  accent = COLORS.primary,
}) {
  return (
    <div
      style={{
        background: COLORS.cardBackground,
        borderRadius: 16,
        padding: 20,
        minWidth: 160,
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1,
          color: COLORS.textSecondary,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.text }}>
        {value}
      </div>
    </div>
  );
}