import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import MealCard from "../components/MealCard";
import MealDetailModal from "../components/MealDetailModal";
import { MEALS, SELECTED_MEALS_KEY } from "../data/mealPlans";
import { useTheme } from "../theme/theme";

export default function MealsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [activeMeal, setActiveMeal] = useState(null);

  const filteredMeals = MEALS.filter((meal) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      meal.name.toLowerCase().includes(query) ||
      meal.goal.toLowerCase().includes(query)
    );
  }).filter(
    (meal) =>
      filter === "All" || meal.type === filter || meal.tags.includes(filter),
  );

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(SELECTED_MEALS_KEY).then((storedIds) => {
        if (storedIds) setSelectedIds(JSON.parse(storedIds));
      });
    }, []),
  );

  const toggleMeal = async (meal) => {
    try {
      const nextIds = selectedIds.includes(meal.id)
        ? selectedIds.filter((id) => id !== meal.id)
        : [...selectedIds, meal.id];
      await AsyncStorage.setItem(SELECTED_MEALS_KEY, JSON.stringify(nextIds));
      setSelectedIds(nextIds);
    } catch (error) {
      Alert.alert("Selection failed", "Could not save your meal plan.");
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: colors.text }]}>Meals</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Build your day one meal at a time.
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("MyMealPlan")}
            style={({ pressed }) => [
              styles.planButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={styles.planButtonText}>My plan</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.selectionSummary,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            MY MEAL PLAN
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {selectedIds.length} selected
          </Text>
          <Text style={[styles.summaryHint, { color: colors.textSecondary }]}>
            Tap a meal below to add or remove it.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Browse Meals
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search meals"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {[
            "All",
            "Breakfast",
            "Lunch",
            "Dinner",
            "Snack",
            "High Protein",
            "Weight Loss",
          ].map((option) => (
            <Pressable
              key={option}
              onPress={() => setFilter(option)}
              style={[
                styles.filter,
                {
                  backgroundColor:
                    filter === option ? colors.primary : colors.cardBackground,
                },
              ]}
            >
              <Text
                style={{
                  color: filter === option ? "#FFFFFF" : colors.text,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {filteredMeals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            selected={selectedIds.includes(meal.id)}
            onPress={() => toggleMeal(meal)}
            onDetailsPress={setActiveMeal}
            colors={colors}
          />
        ))}
      </ScrollView>

      <MealDetailModal
        meal={activeMeal}
        visible={!!activeMeal}
        onClose={() => setActiveMeal(null)}
        isAdded={activeMeal ? selectedIds.includes(activeMeal.id) : false}
        onToggle={() => activeMeal && toggleMeal(activeMeal)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 30, fontWeight: "800" },
  planButton: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  planButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerCopy: { flex: 1, marginRight: 12 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  selectionSummary: { borderRadius: 14, marginTop: 22, padding: 16 },
  summaryLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  summaryValue: { fontSize: 22, fontWeight: "800", marginTop: 5 },
  summaryHint: { fontSize: 12, marginTop: 5 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 28,
  },
  searchInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filters: { gap: 8, paddingBottom: 8 },
  filter: {
    alignItems: "center",
    borderRadius: 18,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
