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
        backgroundImage:
          "linear-gradient(145deg, rgba(255,255,255,0.5), rgba(0,0,0,0.05))",
        borderRadius: 16,
        padding: 20,
        minWidth: 160,
        borderTop: `15px solid ${accent}`,
        boxShadow: `
              inset 1px 1px 2px rgba(255, 255, 255, 0.9),
              inset -1px -1px 2px rgba(0, 0, 0, 0.12),
              -3px -3px 6px rgba(255, 255, 255, 0.9),   
              1px 1px 3px rgba(0, 0, 0, 0.12),          
              3px 3px 6px rgba(0, 0, 0, 0.14),          
              6px 6px 12px rgba(0, 0, 0, 0.16)          
            `,
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
      <div
        style={{
          fontSize: 14,
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
