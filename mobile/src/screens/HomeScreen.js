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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { COLORS } from "../theme/colors";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../theme/theme";
import WorkoutCard from "../components/WorkoutCard";
import StatCard from "../components/StatCard";
import api from "../api/api";
import { MEALS, SELECTED_MEALS_KEY } from "../data/mealPlans";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { toggleTheme, mode, colors } = useTheme();
  const navigation = useNavigation();
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeals, setSelectedMeals] = useState([]);

  const firstName = user?.fullName?.split(" ")[0] || "Pare";

  // Refetch every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTodayWorkout();
      AsyncStorage.getItem(SELECTED_MEALS_KEY).then((storedIds) => {
        const ids = storedIds ? JSON.parse(storedIds) : [];
        setSelectedMeals(MEALS.filter((meal) => ids.includes(meal.id)));
      });
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
        {/* HEADER */}
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

        {/* STATS */}
        <View style={styles.statsRow}>
          <StatCard
            label="CALORIES"
            value="1,000"
            emoji="🔥"
            progress={0.5}
            colors={colors}
          />
          <StatCard
            label="STREAK"
            value="4 days"
            emoji="⚡"
            progress={0.7}
            colors={colors}
          />
        </View>

        {/* WORKOUT */}
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

        <TouchableOpacity
          onPress={() => navigation.navigate("Meals")}
          activeOpacity={0.85}
          style={[
            styles.mealPreview,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <Text style={[styles.mealLabel, { color: colors.textSecondary }]}>
            TODAY'S MEAL PLAN
          </Text>
          <Text style={[styles.mealTitle, { color: colors.text }]}>
            {selectedMeals.length
              ? `${selectedMeals.length} meals selected`
              : "Build your meal plan"}
          </Text>
          <Text style={[styles.mealMeta, { color: colors.primary }]}>
            {selectedMeals.length
              ? selectedMeals.map((meal) => meal.name).join(" · ")
              : "Browse meals to get started"}
          </Text>
        </TouchableOpacity>

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
  mealLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  mealTitle: { fontSize: 20, fontWeight: "800", marginTop: 6 },
  mealMeta: { fontSize: 13, fontWeight: "700", marginTop: 10 },
});
