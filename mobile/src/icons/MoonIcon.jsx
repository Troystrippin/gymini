import Svg, { Path } from "react-native-svg";

const MoonIcon = ({ color = "#000", size = 24, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      fill={color}
      fillRule="evenodd"
      d="M18 2.75a.75.75 0 010-1.5h4a.75.75 0 01.53 1.28l-2.72 2.72H22a.75.75 0 010 1.5h-4a.75.75 0 01-.53-1.28l2.72-2.72H18zm-4.5 6a.75.75 0 010-1.5h3a.75.75 0 01.53 1.28l-1.72 1.72h1.19a.75.75 0 010 1.5h-3a.75.75 0 01-.53-1.28l1.72-1.72H13.5z"
      clipRule="evenodd"
    />
    <Path
      fill={color}
      d="M12 22c5.523 0 10-4.477 10-10 0-.463-.694-.54-.933-.143a6.5 6.5 0 11-8.924-8.924C12.54 2.693 12.463 2 12 2 6.477 2 2 6.477 2 12s4.477 10 10 10z"
    />
  </Svg>
);

export default MoonIcon;
