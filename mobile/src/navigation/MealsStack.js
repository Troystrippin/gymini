import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme/theme";
import MealsScreen from "../screens/MealsScreen";
import MyMealPlanScreen from "../screens/MyMealPlanScreen";

const Stack = createNativeStackNavigator();

export default function MealsStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="BrowseMeals" component={MealsScreen} />
      <Stack.Screen name="MyMealPlan" component={MyMealPlanScreen} />
    </Stack.Navigator>
  );
}
