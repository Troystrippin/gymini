import Svg, { Path } from "react-native-svg";

const ProgressIcon = ({ color = "#000", size = 24, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21H6.2c-1.12 0-1.68 0-2.108-.218a2 2 0 0 1-.874-.874C3 19.48 3 18.92 3 17.8V3m4 12 5-6 4 4 5-6"
    />
  </Svg>
);

export default ProgressIcon;
