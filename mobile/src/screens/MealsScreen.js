import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import MealCard from "../components/MealCard";
import MealDetailModal from "../components/MealDetailModal";
import { useMealPlan } from "../context/MealPlanContext";
import { useTheme } from "../theme/theme";

export default function MealsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const {
    catalog,
    recommendations,
    selectedIds,
    toggleEntry,
    offline,
    loading,
  } = useMealPlan();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [activeMeal, setActiveMeal] = useState(null);

  const filteredMeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog
      .filter(
        (meal) =>
          !q ||
          meal.name.toLowerCase().includes(q) ||
          meal.goal.toLowerCase().includes(q),
      )
      .filter(
        (meal) =>
          filter === "All" ||
          meal.type === filter ||
          (meal.tags || []).includes(filter),
      );
  }, [catalog, search, filter]);

  const filteredRecs = useMemo(
    () => recommendations.filter((r) => !selectedIds.includes(r.id)),
    [recommendations, selectedIds],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {offline && (
          <View
            style={[
              styles.banner,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Working offline — changes will sync when you're back.
            </Text>
          </View>
        )}

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

        {filteredRecs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recommended for you
            </Text>
            {filteredRecs.map((meal) => (
              <MealCard
                key={`rec-${meal.id}`}
                meal={meal}
                selected={false}
                onPress={() => toggleEntry(meal)}
                onDetailsPress={setActiveMeal}
                colors={colors}
              />
            ))}
          </>
        )}

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

        {loading && catalog.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Loading meals…
          </Text>
        ) : (
          filteredMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              selected={selectedIds.includes(meal.id)}
              onPress={() => toggleEntry(meal)}
              onDetailsPress={setActiveMeal}
              colors={colors}
            />
          ))
        )}
      </ScrollView>

      <MealDetailModal
        meal={activeMeal}
        visible={!!activeMeal}
        onClose={() => setActiveMeal(null)}
        isAdded={activeMeal ? selectedIds.includes(activeMeal.id) : false}
        onToggle={() => activeMeal && toggleEntry(activeMeal)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  banner: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
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
  empty: { fontSize: 14, marginTop: 20, textAlign: "center" },
});