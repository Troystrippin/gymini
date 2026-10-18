import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../theme/theme";
import BodyStatCard from "../components/BodyStatCard";
import GoalStatCard from "../components/GoalStatCard";
import FitnessLevelCard from "../components/FitnessLevelCard";
import GoalProgressCard from "../components/GoalProgressCard";
import MilestoneGrid from "../components/MilestoneGrid";
import WeightIcon from "../icons/weight-icon";
import HeightIcon from "../icons/HeightIcon";
import AgeIcon from "../icons/age-icon";
import BmiIcon from "../icons/BMI-icon";
import MoonIcon from "../icons/MoonIcon";
import SunIcon from "../icons/SunIcon";
import TermsIcon from "../icons/TermsIcon";
import { goalsApi } from "../api/goalsApi";
import GYMINI_LOGO from "../icons/GYMINI_LOGO";

const GOALS = [
  { id: "Lose Weight", label: "Fat Loss", icon: "🔥" },
  { id: "Build Muscle", label: "Muscle Gain", icon: "💪" },
  { id: "Improve Endurance", label: "Endurance", icon: "🏃" },
  { id: "Stay Active", label: "Stay Active", icon: "🌿" },
  { id: "Athletic Performance", label: "Athletic", icon: "⚡" },
];

function getFitnessLevel(activityLevel) {
  switch (activityLevel) {
    case "Very Active":
      return "Advanced";
    case "Moderately Active":
      return "Intermediate";
    case "Lightly Active":
    case "Sedentary":
      return "Beginner";
    default:
      return null;
  }
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, completeOnboarding } = useContext(AuthContext);
  const { toggleTheme, colors, mode } = useTheme();
  const profileGoal = user?.profile?.goal ?? user?.goal ?? null;
  const details = user?.profile?.details ?? user?.details;
  const [selectedGoal, setSelectedGoal] = useState(profileGoal);
  const [weightGoal, setWeightGoal] = useState(null);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    setSelectedGoal(profileGoal);
  }, [profileGoal]);

  const fetchGoals = useCallback(async () => {
    try {
      const [active, ms] = await Promise.all([
        goalsApi.active().catch(() => []),
        goalsApi.milestones().catch(() => []),
      ]);
      const w = (active || []).find((g) => g.type === "weight") || null;
      setWeightGoal(w);
      setMilestones(ms || []);
    } catch (err) {
      console.warn("[profile] goals fetch failed:", err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [fetchGoals]),
  );

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
  const fitnessLevel = getFitnessLevel(details?.activityLevel);
  const weight = details?.weightKg;
  const height = details?.heightCm;
  const age = details?.age;
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

  const hasMissingStats = !weight || !height || !age;

  const handleGoalSelect = async (goal) => {
    const previousGoal = selectedGoal;
    setSelectedGoal(goal);
    try {
      await completeOnboarding({ goal });
    } catch (err) {
      setSelectedGoal(previousGoal);
      Alert.alert(
        "Could not update goal",
        err.response?.data?.message || err.message || "Please try again.",
      );
    }
  };

  const handleAbandonGoal = async () => {
    if (!weightGoal) return;
    try {
      await goalsApi.abandon(weightGoal._id);
      setWeightGoal(null);
      await fetchGoals();
    } catch (err) {
      console.warn("[profile] abandon failed:", err.message);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log out", style: "destructive", onPress: () => logout() },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <GYMINI_LOGO color={colors.text} width={25} height={25} />
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        </View>

        <View
          style={[
            styles.profileHeader,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{initials || "?"}</Text>
            )}
          </View>
          <View style={styles.identity}>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>
              Member since: {memberSince}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => navigation.navigate("EditProfile")}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.actionText, { color: colors.text }]}>
              Edit Profile
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("ChangePassword")}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.actionText, { color: colors.text }]}>
              Change Password
            </Text>
          </Pressable>
        </View>

        <View
          style={[styles.statsRow, { backgroundColor: colors.cardBackground }]}
        >
          <BodyStatCard
            label="WEIGHT"
            value={weight ? `${weight} kg` : "—"}
            icon={WeightIcon}
            colors={colors}
            leftBorderColor="#FF9800"
          />
          <BodyStatCard
            label="HEIGHT"
            value={height ? `${height} cm` : "—"}
            icon={HeightIcon}
            colors={colors}
            leftBorderColor="#009688"
          />
          <BodyStatCard
            label="AGE"
            value={age ?? "—"}
            icon={AgeIcon}
            colors={colors}
            leftBorderColor="#8297CD"
          />
          <BodyStatCard
            label="BMI"
            value={bmi ? bmi.toFixed(1) : "—"}
            icon={BmiIcon}
            colors={colors}
            leftBorderColor={colorIndicator}
          />
        </View>

        {hasMissingStats && (
          <Pressable
            onPress={() => navigation.navigate("EditProfile")}
            style={({ pressed }) => [
              styles.emptyHint,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={[styles.emptyHintText, { color: colors.textSecondary }]}
            >
              Some stats are missing. Tap to complete your profile.
            </Text>
          </Pressable>
        )}

        <GoalProgressCard
          goal={weightGoal}
          onEdit={() => navigation.navigate("CreateGoal", { goal: weightGoal })}
          onAbandon={handleAbandonGoal}
          onCreate={() => navigation.navigate("CreateGoal")}
          colors={colors}
        />

        <MilestoneGrid milestones={milestones} colors={colors} />

        <GoalStatCard
          goals={GOALS}
          selectedGoal={selectedGoal}
          onSelect={handleGoalSelect}
          colors={colors}
        />

        <FitnessLevelCard fitnessLevel={fitnessLevel} colors={colors} />

        <View
          style={[
            styles.settingsCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <Text style={styles.settingsEmoji}>
                {mode === "dark" ? (
                  <MoonIcon color={colors.text} size={22} />
                ) : (
                  <SunIcon color={colors.text} size={22} />
                )}
              </Text>
              <View>
                <Text style={[styles.settingsLabel, { color: colors.text }]}>
                  Dark Mode
                </Text>
                <Text
                  style={[styles.settingsHint, { color: colors.textSecondary }]}
                >
                  {mode === "dark" ? "Currently on" : "Currently off"}
                </Text>
              </View>
            </View>
            <Switch
              accessibilityLabel="Toggle dark mode"
              value={mode === "dark"}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            accessibilityRole="link"
            onPress={() => navigation.navigate("Terms")}
            style={({ pressed }) => [
              styles.settingsRow,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <View style={styles.settingsLeft}>
              <TermsIcon color={colors.text} size={22} />
              <Text style={[styles.settingsLabel, { color: colors.text }]}>
                Terms of Service
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>
              ›
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleLogout}
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
  title: { fontSize: 30, fontWeight: "800" },
  titleRow: {
    alignItems: "center",
    justifyContent: "left",
    flexDirection: "row",
    marginBottom: 28,
    gap: 10,
  },
  profileHeader: {
    alignItems: "center",
    borderRadius: 14,
    elevation: 4,
    flexDirection: "row",
    marginBottom: 16,
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
  avatarImage: { width: "100%", height: "100%", borderRadius: 32 },
  identity: { flex: 1, marginLeft: 16 },
  name: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  email: { fontSize: 14 },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
  },

  sectionTitle: { fontSize: 12, fontWeight: "700", marginBottom: 10 },
  statsRow: {
    borderRadius: 14,
    elevation: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 14,
  },
  emptyHint: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
    alignItems: "center",
  },
  emptyHintText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  settingsCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    overflow: "hidden",
  },
  settingsRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  settingsEmoji: { fontSize: 20 },
  settingsLabel: { fontSize: 15, fontWeight: "700" },
  settingsHint: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 16 },
  chevron: { fontSize: 26, fontWeight: "300", lineHeight: 26 },

  logoutButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 28,
    paddingVertical: 15,
  },
  logoutText: { fontSize: 16, fontWeight: "700" },
});
