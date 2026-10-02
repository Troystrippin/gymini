import React from "react";
import { COLORS } from "../theme";

/**
 * Sparkline: single-series line chart.
 * Props:
 *   - data: array of numbers
 *   - width, height: SVG dimensions
 *   - color: stroke color
 */
export function Sparkline({
  data = [],
  width = 300,
  height = 60,
  color = COLORS.primary,
}) {
  if (!data.length) {
    return (
      <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>
        No data
      </div>
    );
  }

  const max = Math.max(...data, 1);
  const step = data.length > 1 ? width / (data.length - 1) : width;

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * BarChart: vertical bars for the last N points.
 * Props:
 *   - data: array of { label, value }
 *   - width, height
 *   - color
 */
export function BarChart({
  data = [],
  width = 300,
  height = 80,
  color = COLORS.primary,
}) {
  if (!data.length) {
    return (
      <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>
        No data
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = width / data.length;
  const gap = Math.min(2, barWidth * 0.2);

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 4);
        const x = i * barWidth + gap / 2;
        const y = height - barH;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={Math.max(1, barWidth - gap)}
            height={Math.max(1, barH)}
            fill={color}
            opacity={d.value === 0 ? 0.15 : 1}
            rx={1}
          />
        );
      })}
    </svg>
  );
}