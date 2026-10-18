import React from "react";

// The original SVG used nested translate() groups; they're baked into the
// polygon points here so the icon is a single clean shape.
export default function LightningIcon({ size = 24, color = "currentColor", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-2 0 20 20"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <polygon points="8 20 8 12 0 12 8 0 8 8 16 8" />
    </svg>
  );
}
