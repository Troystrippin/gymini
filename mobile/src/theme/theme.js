import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors } from "../styles/global";

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = "theme-preference";

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState("system");

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((storedMode) => {
      setPreference(
        storedMode === "light" ||
          storedMode === "dark" ||
          storedMode === "system"
          ? storedMode
          : "system",
      );
    });
  }, []);

  const setMode = (nextMode) => {
    setPreference(nextMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  };

  const mode = preference === "system" ? (systemScheme ?? "dark") : preference;
  const colors = mode === "dark" ? darkColors : lightColors;
  const toggleTheme = () => setMode(mode === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider
      value={{ mode, preference, colors, toggleTheme, setMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
