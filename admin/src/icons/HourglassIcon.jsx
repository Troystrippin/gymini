import React from "react";

export default function HourglassIcon({ size = 24, color = "currentColor", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 2h1V0H2v2h1v2.414L6.586 8 3 11.586V14H2v2h12v-2h-1v-2.414L9.414 8 13 4.414V2zM5 3.586V2h6v1.586l-3 3-3-3z"
        fill={color}
      />
    </svg>
  );
}
