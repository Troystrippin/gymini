import * as React from "react";
import Svg, { Path } from "react-native-svg";

function BmiIcon({ color = "#1C274C", ...props }) {
  return (
    <Svg
      width="800px"
      height="800px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.962 18.469C6.019 16.214 2 12.489 2 8.967 2 3.083 7.5.886 12 5.43 16.5.886 22 3.083 22 8.966c0 3.523-4.02 7.248-6.962 9.503C13.706 19.489 13.04 20 12 20c-1.04 0-1.706-.51-3.038-1.531zM16.5 6.25a.75.75 0 01.75.75v1.25h1.25a.75.75 0 010 1.5h-1.25V11a.75.75 0 01-1.5 0V9.75H14.5a.75.75 0 010-1.5h1.25V7a.75.75 0 01.75-.75z"
        fill={color}
      />
    </Svg>
  );
}

export default BmiIcon;
