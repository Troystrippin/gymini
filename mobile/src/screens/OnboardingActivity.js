import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SelectionCard from "../components/SelectionCard";
import Button from "../components/Button";
import ProgressBar from "../components/ProgressBar";
import { COLORS } from "../theme/colors";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../theme/theme";
import { showValidationAlert } from "../utils/validation";

const ACTIVITY_LEVELS = [
  {
    id: "Sedentary",
    icon: "🛋️",
    title: "Sedentary",
    subtitle: "Desk job, little movement",
  },
  {
    id: "Lightly Active",
    icon: "🚶",
    title: "Lightly Active",
    subtitle: "Light exercise or sports 1-3 days",
  },
  {
    id: "Moderately Active",
    icon: "🏃",
    title: "Moderately Active",
    subtitle: "Moderate exercise or sports 3-5 days a week",
  },
  {
    id: "Very Active",
    icon: "⚡",
    title: "Very Active",
    subtitle: "Intense exercise 6-7 days",
  },
];

const LABELS = { activityLevel: "Activity Level" };

export default function OnboardingActivity({ navigation, route }) {
  const { colors } = useTheme();
  const { goal, biologicalSex, age, height, weight, workoutDaysPerWeek } =
    route.params;
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const { completeOnboarding } = useContext(AuthContext);

  const errors = {
    activityLevel: selected
      ? null
      : "Please choose your activity level to continue",
  };

  const handleComplete = async () => {
    if (showValidationAlert("Cannot Complete Setup", errors, LABELS)) return;

    setLoading(true);
    try {
      await completeOnboarding({
        goal,
        details: {
          biologicalSex,
          age,
          heightCm: height,
          weightKg: weight,
          workoutDaysPerWeek,
          activityLevel: selected,
        },
      });
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
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
        <ProgressBar step={3} totalSteps={3} />
        <Text style={styles.title}>How active are you?</Text>
        <Text style={styles.subtitle}>
          Be honest — this affects your calorie target and recovery plan.
        </Text>

        <View style={styles.cardsContainer}>
          {ACTIVITY_LEVELS.map((level) => (
            <SelectionCard
              key={level.id}
              icon={level.icon}
              title={level.title}
              subtitle={level.subtitle}
              isSelected={selected === level.id}
              onPress={() => setSelected(level.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? "Saving..." : "Complete Setup"}
          onPress={handleComplete}
          disabled={loading}
        />
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