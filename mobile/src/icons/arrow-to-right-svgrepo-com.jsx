import Svg, { Path } from "react-native-svg";

const ArrowRightIcon = ({ size = 24, color = "#000", ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeWidth={2}
      d="m15 8 4 4m0 0-4 4m4-4H5"
    />
  </Svg>
);

export default ArrowRightIcon;
