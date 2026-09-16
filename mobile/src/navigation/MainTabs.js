import React from "react";
import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../screens/HomeScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";
import ProfileScreen from "../screens/ProfileScreen";
import WorkoutStack from "./WorkoutStack";
import { COLORS } from "../theme/colors";
import { useTheme } from "../theme/theme";
import HomeIcon from "../icons/HomeIcon";
import WorkoutIcon from "../icons/WorkOutIcon";
import MealsIcon from "../icons/MealsIcon";
import ProgressIcon from "../icons/ProgressIcon";
import ProfileIcon from "../icons/ProfileIcon";

const Tab = createBottomTabNavigator();

const MealsScreen = () => <PlaceholderScreen title="Meals" Icon={MealsIcon} />;
const ProgressScreen = () => (
  <PlaceholderScreen title="Progress" Icon={ProgressIcon} />
);

const iconFor = (name, focused, color) => {
  const icons = {
    Home: HomeIcon,
    Workouts: WorkoutIcon,
    Meals: MealsIcon,
    Progress: ProgressIcon,
    Profile: ProfileIcon,
  };
  const Icon = icons[name];
  return <Icon color={color} size={22} />;
};

export default function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) =>
          iconFor(route.name, focused, color),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Workouts" component={WorkoutStack} />
      <Tab.Screen name="Meals" component={MealsScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.background,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabLabel: { fontSize: 11, fontWeight: "600", marginTop: 2 },
});