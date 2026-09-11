import Svg, { Path } from "react-native-svg";

const ArrowUpIcon = ({ size = 24, color = "#000", ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeWidth={2}
      d="m16 9-4-4m0 0L8 9m4-4v14"
    />
  </Svg>
);

export default ArrowUpIcon;
