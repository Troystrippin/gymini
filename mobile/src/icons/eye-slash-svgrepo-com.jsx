import Svg, { Path } from "react-native-svg";

const EyeOffIcon = ({ color = "#000", width = 16, height = 16, ...props }) => (
  <Svg width={width} height={height} fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      fill={color}
      fillRule="evenodd"
      d="M16 16h-3l-2.163-2.662a6.405 6.405 0 0 1-7.758-1.643L0 8l3.08-3.695c.07-.085.142-.167.217-.248L0 0h3l13 16ZM5.353 6.588A3 3 0 0 0 8.84 10.88L5.353 6.588Z"
      clipRule="evenodd"
    />
    <Path
      fill={color}
      d="m16 8-1.772 2.127L7.634 2.01a6.408 6.408 0 0 1 5.287 2.295L16 8Z"
    />
  </Svg>
);

export default EyeOffIcon;
