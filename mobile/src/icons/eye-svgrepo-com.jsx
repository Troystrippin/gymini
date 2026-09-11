import Svg, { Path } from "react-native-svg";

const EyeIcon = ({ color = "#000", width = 16, height = 16, ...props }) => (
  <Svg width={width} height={height} fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      fill={color}
      fillRule="evenodd"
      d="m0 8 3.08-3.695a6.405 6.405 0 0 1 9.84 0L16 8l-3.08 3.695a6.405 6.405 0 0 1-9.84 0L0 8Zm8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      clipRule="evenodd"
    />
  </Svg>
);

export default EyeIcon;
