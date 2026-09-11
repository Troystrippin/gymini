import Svg, { Path } from "react-native-svg";

const WorkoutIcon = ({ color = "#000", size = 24, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...props}>
    <Path
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M7 25c-1.7 0-3-1.3-3-3V10c0-1.7 1.3-3 3-3s3 1.3 3 3v12c0 1.7-1.3 3-3 3zM25 25c-1.7 0-3-1.3-3-3V10c0-1.7 1.3-3 3-3s3 1.3 3 3v12c0 1.7-1.3 3-3 3z"
    />
    <Path
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M23 17H9c-.6 0-1-.4-1-1s.4-1 1-1h14c.6 0 1 .4 1 1s-.4 1-1 1zM2 10.2c-1.2.4-2 1.5-2 2.8v6c0 1.3.8 2.4 2 2.8V10.2zM30 10.2v11.6c1.2-.4 2-1.5 2-2.8v-6c0-1.3-.8-2.4-2-2.8z"
    />
  </Svg>
);

export default WorkoutIcon;
