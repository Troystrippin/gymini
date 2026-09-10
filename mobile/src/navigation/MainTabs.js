import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

const WorkoutsScreen = () => <PlaceholderScreen title="Workouts" emoji="🏋️" />;
const MealsScreen = () => <PlaceholderScreen title="Meals" emoji="🍽️" />;
const ProgressScreen = () => <PlaceholderScreen title="Progress" emoji="📈" />;
const ProfileScreen = () => <PlaceholderScreen title="Profile" emoji="👤" />;

const iconFor = (name, focused) => {
  const icons = {
    Home: '🏠',
    Workouts: '🏋️',
    Meals: '🍽️',
    Progress: '📈',
    Profile: '👤',
  };
  return <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icons[name]}</Text>;
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => iconFor(route.name, focused),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Workouts" component={WorkoutsScreen} />
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
  tabIcon: { fontSize: 20, opacity: 0.6 },
  tabIconFocused: { opacity: 1 },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});