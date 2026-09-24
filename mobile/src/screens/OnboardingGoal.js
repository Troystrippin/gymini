import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SelectionCard from "../components/SelectionCard";
import Button from "../components/Button";
import ProgressBar from "../components/ProgressBar";
import { COLORS } from "../theme/colors";
import { useTheme } from "../theme/theme";
import { showValidationAlert } from "../utils/validation";

const GOALS = [
  {
    id: "Lose Weight",
    icon: "🔥",
    title: "Lose Weight",
    subtitle: "Burn fat and get leaner",
  },
  {
    id: "Build Muscle",
    icon: "💪",
    title: "Build Muscle",
    subtitle: "Increase size and strength",
  },
  {
    id: "Improve Endurance",
    icon: "🏃",
    title: "Improve Endurance",
    subtitle: "Improve stamina & cardio",
  },
  {
    id: "Stay Active",
    icon: "🌿",
    title: "Stay Active",
    subtitle: "Maintain health & energy",
  },
  {
    id: "Athletic Performance",
    icon: "⚡",
    title: "Athletic Performance",
    subtitle: "Train like an athlete",
  },
];

const LABELS = { goal: "Goal" };

export default function OnboardingGoal({ navigation }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState(null);

  const errors = {
    goal: selected ? null : "Please choose one of the options to continue",
  };

  const handleContinue = () => {
    if (showValidationAlert("Cannot Continue", errors, LABELS)) return;
    navigation.navigate("OnboardingDetails", { goal: selected });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProgressBar step={1} totalSteps={3} />
        <Text style={styles.title}>What's your main goal?</Text>
        <Text style={styles.subtitle}>
          This helps us personalize your coaching and workout plan.
        </Text>

        <View style={styles.cardsContainer}>
          {GOALS.map((goal) => (
            <SelectionCard
              key={goal.id}
              icon={goal.icon}
              title={goal.title}
              subtitle={goal.subtitle}
              isSelected={selected === goal.id}
              onPress={() => setSelected(goal.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  backArrow: { color: COLORS.text, fontSize: 24, fontWeight: "bold" },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 24 },
  cardsContainer: { marginTop: 8 },
  footer: { paddingHorizontal: 24, paddingBottom: 12 },
});