import React, { useContext, useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../theme/theme";
import BodyStatCard from "../components/BodyStatCard";
import GoalStatCard from "../components/GoalStatCard";
import FitnessLevelCard from "../components/FitnessLevelCard";
import WeightIcon from "../icons/weight-icon";
import HeightIcon from "../icons/HeightIcon";
import AgeIcon from "../icons/age-icon";
import BmiIcon from "../icons/BMI-icon";

const GOALS = [
  { id: "Lose Weight", label: "Fat Loss", icon: "🔥" },
  { id: "Build Muscle", label: "Muscle Gain", icon: "💪" },
  { id: "Improve Endurance", label: "Endurance", icon: "🏃" },
  { id: "Athletic Performance", label: "Athletic", icon: "⚡" },
];

function getFitnessLevel(activityLevel) {
  if (
    activityLevel === "Very Active" ||
    activityLevel === "Athletic Performance"
  ) {
    return "Advance";
  }

  if (activityLevel === "Moderately Active") {
    return "Intermediate";
  }

  return activityLevel ? "Beginner" : null;
}

export default function ProfileScreen() {
  const { user, logout, completeOnboarding } = useContext(AuthContext);
  const { colors, mode } = useTheme();
  const [selectedGoal, setSelectedGoal] = useState(user?.profile?.goal ?? null);
  const name = user?.fullName || "Your name";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "Unavailable";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const details = user?.profile?.details;
  const fitnessLevel = getFitnessLevel(details?.activityLevel);
  const weight = details?.weightKg;
  const height = details?.heightCm;
  const bmi = weight && height ? weight / (height / 100) ** 2 : null;
  const colorIndicator = !bmi
    ? "#B0BEC5"
    : bmi < 18.5
      ? "#2196F3"
      : bmi < 25
        ? "#4CAF50"
        : bmi < 30
          ? "#FF9800"
          : bmi < 40
            ? "#F44336"
            : "#7B1FA2";

  const handleGoalSelect = async (goal) => {
    setSelectedGoal(goal);
    await completeOnboarding({ goal });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>

        <View
          style={[
            styles.profileHeader,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials || "?"}</Text>
          </View>
          <View style={styles.identity}>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>
              Member since: {memberSince}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Body Stats
        </Text>
        <View
          style={[styles.statsRow, { backgroundColor: colors.cardBackground }]}
        >
          <BodyStatCard
            label="WEIGHT"
            value={weight ? `${weight} kg` : "N/A"}
            icon={WeightIcon}
            colors={colors}
            leftBorderColor="#FF9800"
          />
          <BodyStatCard
            label="HEIGHT"
            value={height ? `${height} cm` : "N/A"}
            icon={HeightIcon}
            colors={colors}
            leftBorderColor="#009688"
          />
          <BodyStatCard
            label="AGE"
            value={details?.age ?? "N/A"}
            icon={AgeIcon}
            colors={colors}
            leftBorderColor="#8297CD"
          />
          <BodyStatCard
            label="BMI"
            value={bmi ? bmi.toFixed(1) : "N/A"}
            icon={BmiIcon}
            colors={colors}
            leftBorderColor={colorIndicator}
          />
        </View>

        <GoalStatCard
          goals={GOALS}
          selectedGoal={selectedGoal}
          onSelect={handleGoalSelect}
          colors={colors}
        />

        <FitnessLevelCard fitnessLevel={fitnessLevel} colors={colors} />

        <Pressable
          accessibilityRole="button"
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutButton,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.logoutText, { color: colors.primary }]}>
            Log out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 28 },
  profileHeader: {
    alignItems: "center",
    borderRadius: 14,
    elevation: 4,
    flexDirection: "row",
    marginBottom: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  avatarText: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  identity: { flex: 1, marginLeft: 16 },
  name: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  email: { fontSize: 14 },
  sectionTitle: { fontSize: 12, fontWeight: "700", marginBottom: 10 },
  statsRow: {
    borderRadius: 14,
    elevation: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 14,
  },
  logoutButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 28,
    paddingVertical: 15,
  },
  logoutText: { fontSize: 16, fontWeight: "700" },
});