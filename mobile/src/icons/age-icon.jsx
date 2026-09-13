import * as React from "react";
import Svg, { G, Path } from "react-native-svg";

function AgeIcon(props) {
  return (
    <Svg
      width="800px"
      height="800px"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <G data-name="Layer 2">
        <Path fill="none" data-name="invisible box" d="M0 0H48V48H0z" />
        <Path
          d="M40 42h-2v-7.5a7.9 7.9 0 00-2.3-5.7L30.8 24l4.9-4.8a7.9 7.9 0 002.3-5.7V6h2a2 2 0 000-4H8a2 2 0 000 4h2v7.5a7.9 7.9 0 002.3 5.7l4.9 4.8-4.9 4.8a7.9 7.9 0 00-2.3 5.7V42H8a2 2 0 000 4h32a2 2 0 000-4zM15.2 31.7l6.2-6.3a1.9 1.9 0 000-2.8l-6.2-6.3a3.6 3.6 0 01-1.2-2.8V6h20v7.5a3.6 3.6 0 01-1.2 2.8l-6.2 6.3a1.9 1.9 0 000 2.8l6.2 6.3a3.6 3.6 0 011.2 2.8v6.3l-7.2-7.3a3.9 3.9 0 00-5.6 0L14 40.8v-6.3a3.6 3.6 0 011.2-2.8zM29.6 42H18.4l5.6-5.7z"
          data-name="icons Q2"
        />
      </G>
    </Svg>
  );
}

export default AgeIcon;
