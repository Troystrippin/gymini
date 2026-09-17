import React from "react";
import { StatusBar, View } from "react-native";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { PlanDraftProvider } from "./src/context/PlanDraftContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider, useTheme } from "./src/theme/theme";

function AppContent() {
  const { mode, colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer
        theme={{
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: colors.background,
            card: colors.background,
            border: colors.border,
            primary: colors.primary,
            text: colors.text,
          },
        }}
      >
        <StatusBar
          barStyle={mode === "dark" ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
          translucent={false}
        />
        <AppNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <PlanDraftProvider>
            <AppContent />
          </PlanDraftProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
