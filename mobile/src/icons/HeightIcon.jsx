import * as React from "react";
import Svg, { Path } from "react-native-svg";

function HeightIcon(props) {
  return (
    <Svg
      fill="#000"
      height="800px"
      width="800px"
      baseProfile="tiny"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-69 0 117 256"
      xmlSpace="preserve"
      {...props}
    >
      <Path d="M-10.9 4.9C.4 4.9 9.6 14.1 9.6 25.4S.4 45.9-10.9 45.9s-20.5-9.2-20.5-20.5 9.2-20.5 20.5-20.5zm25.8 46.3h-51.2c-14.2 0-25.6 11.4-25.6 25.6v62.6c0 4.9 3.9 9 9 9s9-3.9 9-9V81.9c0-1.4 1.2-2.6 2.6-2.6s2.6 1.2 2.6 2.6v155.2c0 7.7 5.7 14 12.8 14s12.8-6.3 12.8-14v-88.5c0-1.4 1.2-2.6 2.6-2.6 1.4 0 2.6 1.2 2.6 2.6v88.5c0 7.7 5.7 14 12.8 14 7.1 0 12.8-6.3 12.8-14V81.9c0-1.4 1.2-2.6 2.6-2.6s2.6 1.2 2.6 2.6v57.6c0 4.9 3.9 9 9 9s9-3.9 9-9V76.8c-.4-14.2-12.1-25.6-26-25.6z" />
    </Svg>
  );
}

export default HeightIcon;
