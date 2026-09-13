import { StyleSheet } from "react-native";

export const lightColors = {
  background: "#F7F7F8",
  text: "#171719",
  textSecondary: "#6F7078",
  surface: "#f0eef7",
  card: "#ebe7f5",
  cardBackground: "#ebe7f5",
  inputBg: "#F0F0F2",
  accent: "#6B45D3",
  primary: "#6B45D3",
  accentMuted: "rgba(107, 69, 211, 0.15)",
  border: "#a29cb5",
  warning: "#ff5c4d",
  success: "#d9ff4d",
  selectedcard: "#c3bade",
};

export const darkColors = {
  background: "#0D0D0D",
  text: "#FFFFFF",
  textSecondary: "#A2A2A8",
  surface: "#141414",
  card: "#1A1A1A",
  cardBackground: "#1A1A1A",
  inputBg: "#202024",
  accent: "#6B45D3",
  primary: "#6B45D3",
  accentMuted: "rgba(107, 69, 211, 0.15)",
  border: "#434242",
  warning: "#ff5c4d",
  success: "#d9ff4d",
  selectedcard: "rgba(107, 69, 211, 0.15)",
};

export function getGlobalStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      width: "100%",
      maxWidth: 480,
      alignSelf: "center",
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
    },
    text: {
      fontSize: 14,
      color: colors.text,
    },
    surface: {
      backgroundColor: colors.surface,
    },
  });
}
