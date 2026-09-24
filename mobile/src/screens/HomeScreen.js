import React, { useContext, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { COLORS } from "../theme/colors";
import { AuthContext } from "../context/AuthContext";
import { useMealPlan } from "../context/MealPlanContext";
import { useTheme } from "../theme/theme";
import WorkoutCard from "../components/WorkoutCard";
import StatCard from "../components/StatCard";
import api from "../api/api";
import { formatCalories } from "../utils/nutrition";

const MEAL_TYPE_ICONS = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
  snack: "🍎",
};

const MEAL_TYPE_ORDER = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { toggleTheme, mode, colors } = useTheme();
  const navigation = useNavigation();
  const { entries, totals } = useMealPlan();

  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const firstName = user?.fullName?.split(" ")[0] || "Pare";

  useFocusEffect(
    useCallback(() => {
      fetchTodayWorkout();
      fetchStats();
    }, []),
  );

  const fetchTodayWorkout = async () => {
    try {
      setLoading(true);
      const res = await api.get("/workouts/today");
      setWorkout(res.data);
      setExercises(res.data.exercises || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setWorkout(null);
        setExercises([]);
      } else {
        Alert.alert("Error", err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/workouts/stats");
      setStats(res.data);
    } catch (err) {
      setStats(null);
    }
  };

  const mealsByType = MEAL_TYPE_ORDER.map((type) => ({
    type,
    meal: entries.find((m) => m.type === type) || null,
  }));

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.date}>{getTodayString()}</Text>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Good Morning,{"\n"}
              <Text style={[styles.greetingName, { color: colors.primary }]}>
                {firstName}
              </Text>{" "}
              👋
            </Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={toggleTheme}>
            <Text style={styles.settingsIcon}>
              {mode === "dark" ? "☀️" : "🌙"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="SESSIONS"
            value={String(stats?.totalSessions ?? 0)}
            emoji="🔥"
            progress={Math.min(1, (stats?.thisWeekSessions ?? 0) / 7)}
            colors={colors}
          />
          <StatCard
            label="STREAK"
            value={`${stats?.currentStreak ?? 0} ${
              stats?.currentStreak === 1 ? "day" : "days"
            }`}
            emoji="⚡"
            progress={Math.min(1, (stats?.currentStreak ?? 0) / 7)}
            colors={colors}
          />
        </View>

        {workout && exercises.length > 0 ? (
          <WorkoutCard
            workout={workout}
            exercises={exercises}
            progress={0}
            onPress={() =>
              navigation.navigate("Workouts", { screen: "WorkoutSession" })
            }
            colors={colors}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>💤</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No workout plan yet
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              Create one to get started
            </Text>
          </View>
        )}

        <View
          style={[
            styles.mealPreview,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={styles.mealHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mealLabel, { color: colors.textSecondary }]}>
                TODAY'S MEAL PLAN
              </Text>
              <Text style={[styles.mealTitle, { color: colors.text }]}>
                {entries.length
                  ? `${entries.length} of 4 meals set`
                  : "Build your meal plan"}
              </Text>
            </View>
            {entries.length > 0 && (
              <View
                style={[
                  styles.caloriesPill,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[styles.caloriesPillText, { color: colors.primary }]}
                >
                  {formatCalories(totals.calories)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.mealList}>
            {mealsByType.map(({ type, meal }) => (
              <TouchableOpacity
                key={type}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Meals")}
                style={[styles.mealRow, { borderColor: colors.border }]}
              >
                <View
                  style={[
                    styles.mealRowIcon,
                    {
                      backgroundColor: meal ? colors.background : "transparent",
                      borderColor: colors.border,
                      borderWidth: meal ? 0 : 1,
                      borderStyle: meal ? "solid" : "dashed",
                    },
                  ]}
                >
                  <Text style={styles.mealRowIconText}>
                    {MEAL_TYPE_ICONS[type.toLowerCase()]}
                  </Text>
                </View>

                <View style={styles.mealRowInfo}>
                  <Text
                    style={[
                      styles.mealRowType,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {type.toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      styles.mealRowName,
                      { color: meal ? colors.text : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {meal ? meal.name : "Not set"}
                  </Text>
                </View>

                {meal ? (
                  <Text
                    style={[styles.mealRowCalories, { color: colors.primary }]}
                  >
                    {meal.calories} kcal
                  </Text>
                ) : (
                  <Text style={[styles.mealRowAdd, { color: colors.primary }]}>
                    + Add
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("Meals")}
            activeOpacity={0.85}
            style={styles.browseButton}
          >
            <Text style={[styles.browseButtonText, { color: colors.primary }]}>
              Browse all meals →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getTodayString() {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const d = new Date();
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 10 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  date: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 6 },
  greeting: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
  },
  greetingName: { color: COLORS.primary },
  settingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsIcon: { fontSize: 22 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  emptyState: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  emptySubtext: { fontSize: 13 },
  mealPreview: { borderRadius: 18, marginTop: 20, padding: 18 },
  mealHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  mealLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  mealTitle: { fontSize: 20, fontWeight: "800", marginTop: 6 },
  caloriesPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  caloriesPillText: { fontSize: 12, fontWeight: "800" },
  mealList: { marginTop: 16, gap: 10 },
  mealRow: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    padding: 10,
  },
  mealRowIcon: {
    alignItems: "center",
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    marginRight: 12,
    width: 38,
  },
  mealRowIconText: { fontSize: 18 },
  mealRowInfo: { flex: 1 },
  mealRowType: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  mealRowName: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  mealRowCalories: { fontSize: 12, fontWeight: "800", marginLeft: 8 },
  mealRowAdd: { fontSize: 12, fontWeight: "800", marginLeft: 8 },
  browseButton: { alignItems: "center", marginTop: 14 },
  browseButtonText: { fontSize: 13, fontWeight: "800" },
});