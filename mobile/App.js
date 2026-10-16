import React from "react";
import { StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { PlanDraftProvider } from "./src/context/PlanDraftContext";
import { MealPlanProvider } from "./src/context/MealPlanContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider, useTheme } from "./src/theme/theme";
import { GoogleOneTapSignIn } from "react-native-nitro-google-signin";

GoogleOneTapSignIn.configure({
  webClientId:
    "739890437061-orlflatdgop8iale1926tn4c3qf55blh.apps.googleusercontent.com",
  iosClientId:
    "739890437061-l7k645rp1cik7kic2hq8srh37ok8cicv.apps.googleusercontent.com",
});

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <PlanDraftProvider>
              <MealPlanProvider>
                <AppContent />
              </MealPlanProvider>
            </PlanDraftProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
