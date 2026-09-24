import React, { useCallback } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import MealCard from "../components/MealCard";
import { useMealPlan } from "../context/MealPlanContext";
import { useTheme } from "../theme/theme";
import { formatCalories, formatProtein } from "../utils/nutrition";

export default function MyMealPlanScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { entries, totals, removeEntry, repeatYesterday, refresh } =
    useMealPlan();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onRemove = async (meal) => {
    try {
      await removeEntry(meal.mealId);
    } catch {
      Alert.alert("Update failed", "Could not remove this meal.");
    }
  };

  const onRepeat = async () => {
    const res = await repeatYesterday();
    if (!res.ok) {
      Alert.alert("Nothing to repeat", res.message);
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
          {entries.length} meals selected for today.
        </Text>

        <View
          style={[styles.macrosCard, { backgroundColor: colors.cardBackground }]}
        >
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: colors.primary }]}>
              {formatCalories(totals.calories)}
            </Text>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
              CALORIES
            </Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: colors.text }]}>
              {formatProtein(totals.protein)}
            </Text>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
              PROTEIN
            </Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: colors.text }]}>
              {formatProtein(totals.carbs)}
            </Text>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
              CARBS
            </Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: colors.text }]}>
              {formatProtein(totals.fats)}
            </Text>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
              FATS
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onRepeat}
          style={({ pressed }) => [
            styles.repeatButton,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.repeatText, { color: colors.primary }]}>
            ↻ Repeat yesterday's plan
          </Text>
        </Pressable>

        {entries.length ? (
          entries.map((meal) => (
            <MealCard
              key={meal.mealId}
              meal={{
                id: meal.mealId,
                type: meal.type,
                name: meal.name,
                goal: "",
                tags: [],
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fats: meal.fats,
                image: "",
                description: "",
              }}
              selected
              onPress={() => onRemove(meal)}
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
  subtitle: { fontSize: 14, marginTop: 6, marginBottom: 20 },
  macrosCard: {
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    padding: 14,
  },
  macroItem: { alignItems: "center", flex: 1 },
  macroValue: { fontSize: 16, fontWeight: "800" },
  macroLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  repeatButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
    paddingVertical: 12,
  },
  repeatText: { fontSize: 13, fontWeight: "800" },
  empty: { fontSize: 14, marginTop: 28 },
});