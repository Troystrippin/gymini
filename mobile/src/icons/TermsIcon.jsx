import Svg, { Path } from "react-native-svg";

const TermsIcon = ({ color = "#000", size = 24, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      fill={color}
      fillRule="evenodd"
      d="M9 2h-.066c-.887 0-1.65 0-2.262.082-.656.088-1.284.287-1.794.797s-.709 1.138-.797 1.793C3.999 5.284 4 6.048 4 6.934V16.17A3.001 3.001 0 0 0 2 19c0 1.657 1.343 3 3 3h10.997L16 22c1.657 0 3-1.343 3-3V7h.5C20.881 7 22 5.881 22 4.5S20.881 2 19.5 2c-.104 0-.206.006-.307.019A1.99 1.99 0 0 0 19 2H9Zm4.171 18A2.99 2.99 0 0 1 13 19v-1H5a1 1 0 1 0 0 2h8.171ZM19 5h.5a.5.5 0 0 0 0-1 .5.5 0 0 0-.5.5V5ZM8 7a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2H9Z"
      clipRule="evenodd"
    />
  </Svg>
);

export default TermsIcon;
