import React, { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import MealCard from "../components/MealCard";
import MealDetailModal from "../components/MealDetailModal";
import { useMealPlan } from "../context/MealPlanContext";
import { useTheme } from "../theme/theme";
import GYMINI_LOGO from "../icons/GYMINI_LOGO";

const FILTER_OPTIONS = [
  "All",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "High Protein",
  "Weight Loss",
];

const MealListItem = memo(function MealListItem({
  meal,
  selected,
  onToggleEntry,
  onOpenMeal,
  colors,
}) {
  return (
    <MealCard
      meal={meal}
      selected={selected}
      onPress={() => onToggleEntry(meal)}
      onDetailsPress={onOpenMeal}
      colors={colors}
    />
  );
});

export default function MealsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { height: windowHeight } = useWindowDimensions();
  const {
    catalog,
    recommendations,
    selectedIds,
    toggleEntry,
    offline,
    loading,
  } = useMealPlan();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState([]);
  const [draftFilters, setDraftFilters] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeMeal, setActiveMeal] = useState(null);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const normalizedSearch = search.trim().toLowerCase();
  const toggleMeal = useCallback((meal) => toggleEntry(meal), [toggleEntry]);
  const openMealDetails = useCallback((meal) => setActiveMeal(meal), []);

  const toggleDraftFilter = (option) => {
    setDraftFilters((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  };

  const mealListHeight = Math.max(320, Math.round(windowHeight * 0.55));

  const filteredMeals = useMemo(() => {
    return catalog.filter((meal) => {
      const matchesSearch =
        !normalizedSearch ||
        (meal.name || "").toLowerCase().includes(normalizedSearch) ||
        (meal.goal || "").toLowerCase().includes(normalizedSearch);
      const matchesFilter =
        filters.length === 0 ||
        filters.some(
          (option) =>
            meal.type === option || (meal.tags || []).includes(option),
        );
      return matchesSearch && matchesFilter;
    });
  }, [catalog, normalizedSearch, filters]);

  const filteredRecs = useMemo(
    () =>
      recommendations.filter(
        (recommendation) => !selectedIdSet.has(recommendation.id),
      ),
    [recommendations, selectedIdSet],
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {offline && (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Working offline — changes will sync when you're back.
            </Text>
          </View>
        )}

        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <GYMINI_LOGO color={colors.text} width={25} height={25} />
              <Text style={[styles.title, { color: colors.text }]}>Meals</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Build your day one meal at a time.
            </Text>
          </View>
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

        <TouchableOpacity
          onPress={() => navigation.navigate("MyMealPlan")}
          style={[styles.planButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.planText}>My plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Chat")}
          style={[styles.coachCard, { backgroundColor: colors.cardBackground }]}
        >
          <GYMINI_LOGO width={30} height={30} color={colors.text} />
          <View style={styles.coachText}>
            <Text style={[styles.coachTitle, { color: colors.text }]}>
              AI Coach
            </Text>
            <Text
              style={[styles.coachSubtitle, { color: colors.textSecondary }]}
            >
              Get help with workouts and meals
            </Text>
          </View>
        </TouchableOpacity>

        {filteredRecs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recommended for you
            </Text>
            {filteredRecs.map((meal) => (
              <MealListItem
                key={`rec-${meal.id}`}
                meal={meal}
                selected={false}
                onToggleEntry={toggleMeal}
                onOpenMeal={openMealDetails}
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
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setDraftFilters(filters);
            setFilterModalVisible(true);
          }}
          style={[
            styles.filterButton,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.filterButtonText, { color: colors.text }]}>
            {filters.length === 0
              ? "Filters: All"
              : `Filters: ${filters.length} selected`}
          </Text>
        </TouchableOpacity>

        <View style={[styles.mealBox, { maxHeight: mealListHeight }]}>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {filteredMeals.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                {loading && catalog.length === 0
                  ? "Loading meals…"
                  : "No meals match your search."}
              </Text>
            ) : (
              filteredMeals.map((meal) => (
                <MealListItem
                  key={String(meal.id)}
                  meal={meal}
                  selected={selectedIdSet.has(meal.id)}
                  onToggleEntry={toggleMeal}
                  onOpenMeal={openMealDetails}
                  colors={colors}
                />
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.filterModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFilterModalVisible(false)}
          />

          <View
            style={[
              styles.filterModalSheet,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={[styles.filterModalTitle, { color: colors.text }]}>
              Filter meals
            </Text>

            <ScrollView contentContainerStyle={styles.filterOptions}>
              {FILTER_OPTIONS.filter((option) => option !== "All").map(
                (option) => {
                  const selected = draftFilters.includes(option);

                  return (
                    <Pressable
                      key={option}
                      onPress={() => toggleDraftFilter(option)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      style={[
                        styles.filterOption,
                        {
                          backgroundColor: selected
                            ? colors.primary
                            : colors.cardBackground,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          {
                            color: selected ? "#FFFFFF" : colors.text,
                            fontWeight: selected ? "700" : "400",
                          },
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </ScrollView>

            <View style={styles.filterActions}>
              <Pressable
                onPress={() => setDraftFilters([])}
                style={[styles.filterAction, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text }}>Clear</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setFilters(draftFilters);
                  setFilterModalVisible(false);
                }}
                style={[
                  styles.filterAction,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                  Apply
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <MealDetailModal
        meal={activeMeal}
        visible={!!activeMeal}
        onClose={() => setActiveMeal(null)}
        isAdded={activeMeal ? selectedIdSet.has(activeMeal.id) : false}
        onToggle={() => activeMeal && toggleEntry(activeMeal)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 8 },
  banner: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: { fontSize: 30, fontWeight: "800" },
  titleRow: {
    alignItems: "center",
    justifyContent: "left",
    flexDirection: "row",
    gap: 10,
  },

  planButton: {
    alignItems: "center",
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },
  planText: { fontSize: 16, fontWeight: "800", color: COLORS.buttonText },
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
  filterRow: { flexGrow: 0, flexShrink: 0, marginBottom: 6 },
  filters: { gap: 8, paddingBottom: 8 },
  filter: {
    alignItems: "center",
    borderRadius: 18,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mealBox: { marginTop: 6 },
  empty: { fontSize: 14, marginTop: 20, textAlign: "center" },
  filterButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 14,
  },

  filterButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  filterModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  filterModalSheet: {
    maxHeight: "80%",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  filterModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: 8,
  },

  filterOption: {
    width: "48%",
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
  },

  filterOptionText: {
    textAlign: "center",
    fontSize: 14,
  },

  filterActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },

  filterAction: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
  },
  coachCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: 16,
    padding: 18,
    elevation: 2,
  },
  coachEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  coachText: {
    flex: 1,
    marginLeft: 15,
  },
  coachTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  coachSubtitle: {
    fontSize: 13,
  },
  coachArrow: {
    fontSize: 22,
    fontWeight: "700",
  },
});
