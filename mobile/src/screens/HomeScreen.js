import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../theme/colors";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../theme/theme";
import WorkoutCard from "../components/WorkoutCard";

// ---- Sample workout data (we'll replace with real data later) ----
const WORKOUT = {
  title: "Leg Day",
  emoji: "🦵",
  exercises: [
    { id: 1, name: "Barbell Squat", muscle: "Quads", sets: "4×8", done: true },
    {
      id: 2,
      name: "Romanian Deadlift",
      muscle: "Hamstrings",
      sets: "3×10",
      done: true,
    },
    { id: 3, name: "Leg Press", muscle: "Quads", sets: "3×12", done: false },
    {
      id: 4,
      name: "Walking Lunge",
      muscle: "Glutes",
      sets: "3×20",
      done: false,
    },
    { id: 5, name: "Calf Raise", muscle: "Calves", sets: "4×15", done: false },
  ],
};

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { toggleTheme, mode, colors } = useTheme();
  const [exercises, setExercises] = useState(WORKOUT.exercises);
  const firstName = user?.fullName?.split(" ")[0] || "Pare";

  const completedCount = exercises.filter((exercise) => exercise.done).length;
  const totalCount = exercises.length;
  const progress = completedCount / totalCount;

  const toggleExercise = (exerciseId) => {
    setExercises((currentExercises) =>
      currentExercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, done: !exercise.done }
          : exercise,
      ),
    );
  };

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
        {/* ---- HEADER ---- */}
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
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={toggleTheme}
            accessibilityRole="button"
          >
            <Text style={styles.settingsIcon}>
              {mode === "dark" ? "☀️" : "🌙"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---- STATS ROW ---- */}
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

        <WorkoutCard
          workout={WORKOUT}
          exercises={exercises}
          progress={progress}
          onToggle={toggleExercise}
          colors={colors}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---- Helpers ----

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

function StatCard({ label, value, emoji, progress, colors }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.statHeader}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={styles.statEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <View style={[styles.statBarBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.statBarFill,
            { width: `${progress * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 10 },

  // Header
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

  // Stats
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 18,
    padding: 16,
    elevation: 4,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statEmoji: { fontSize: 18 },
  statValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 14,
  },
  statBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
});
