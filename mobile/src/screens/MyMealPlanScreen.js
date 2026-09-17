import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import MealCard from "../components/MealCard";
import { MEALS, SELECTED_MEALS_KEY } from "../data/mealPlans";
import { useTheme } from "../theme/theme";

export default function MyMealPlanScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [selectedIds, setSelectedIds] = useState([]);
  const selectedMeals = MEALS.filter((meal) => selectedIds.includes(meal.id));

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(SELECTED_MEALS_KEY).then((storedIds) => {
        setSelectedIds(storedIds ? JSON.parse(storedIds) : []);
      });
    }, []),
  );

  const removeMeal = async (meal) => {
    try {
      const nextIds = selectedIds.filter((id) => id !== meal.id);
      await AsyncStorage.setItem(SELECTED_MEALS_KEY, JSON.stringify(nextIds));
      setSelectedIds(nextIds);
    } catch (error) {
      Alert.alert("Update failed", "Could not remove this meal.");
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.textSecondary }]}>
            Browse meals
          </Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>My Meal Plan</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {selectedMeals.length} meals selected for today.
        </Text>
        {selectedMeals.length ? (
          selectedMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              selected
              onPress={() => removeMeal(meal)}
              actionLabel="Remove"
              colors={colors}
            />
          ))
        ) : (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No meals added yet. Browse meals to build your plan.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  back: { fontSize: 14, fontWeight: "700", marginBottom: 20 },
  title: { fontSize: 30, fontWeight: "800" },
  subtitle: { fontSize: 14, marginTop: 6, marginBottom: 24 },
  empty: { fontSize: 14, marginTop: 28 },
});
