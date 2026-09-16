import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme/theme";

import PlanScreen from "../screens/PlanScreen";
import BrowseExercisesScreen from "../screens/BrowseExercisesScreen";

const Stack = createNativeStackNavigator();

export default function WorkoutStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="PlanList" component={PlanScreen} />
      <Stack.Screen name="BrowseExercises" component={BrowseExercisesScreen} />
    </Stack.Navigator>
  );
}