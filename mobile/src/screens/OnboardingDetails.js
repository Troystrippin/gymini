import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import ProgressBar from "../components/ProgressBar";
import { COLORS } from "../theme/colors";
import { useTheme } from "../theme/theme";
import {
  validateAge,
  validateHeight,
  validateWeight,
  showValidationAlert,
} from "../utils/validation";

const LABELS = {
  biologicalSex: "Biological Sex",
  age: "Age",
  heightCm: "Height",
  weightKg: "Weight",
  workoutDaysPerWeek: "Workout Days / Week",
};

export default function OnboardingDetails({ navigation, route }) {
  const { colors } = useTheme();
  const { goal } = route.params;
  const [sex, setSex] = useState(null);
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [days, setDays] = useState(null);
  const [touched, setTouched] = useState({
    sex: false,
    age: false,
    height: false,
    weight: false,
    days: false,
  });

  // ── Per-field errors ─────────────────────────────────────────────
  const errors = {
    biologicalSex: sex ? null : "Please select your biological sex",
    age: !age
      ? "Age is required"
      : validateAge(age),
    heightCm: !height
      ? "Height is required"
      : validateHeight(height),
    weightKg: !weight
      ? "Weight is required"
      : validateWeight(weight),
    workoutDaysPerWeek:
      days === null ? "Please select your workout days per week" : null,
  };

  const handleBlur = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleContinue = () => {
    // Reveal all inline errors
    setTouched({
      sex: true,
      age: true,
      height: true,
      weight: true,
      days: true,
    });

    // Block if any error
    if (showValidationAlert("Cannot Continue", errors, LABELS)) return;

    navigation.navigate("OnboardingActivity", {
      goal,
      biologicalSex: sex,
      age: parseInt(age, 10),
      height: parseFloat(height),
      weight: parseFloat(weight),
      workoutDaysPerWeek: days,
    });
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ProgressBar step={2} totalSteps={3} />
          <Text style={styles.title}>Your Details</Text>
          <Text style={styles.subtitle}>
            This helps us calculate your baseline and build a perfect plan for
            you.
          </Text>

          {/* ── Biological Sex ─────────────────────────────── */}
          <Text style={styles.fieldLabel}>BIOLOGICAL SEX</Text>
          <View style={styles.toggleRow}>
            {["Male", "Female"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.toggleBtn,
                  sex === option && styles.toggleBtnActive,
                  touched.sex &&
                    errors.biologicalSex &&
                    styles.toggleBtnError,
                ]}
                onPress={() => {
                  setSex(option);
                  handleBlur("sex");
                }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    sex === option && styles.toggleTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {touched.sex && errors.biologicalSex ? (
            <Text style={styles.errorText}>{errors.biologicalSex}</Text>
          ) : null}

          {/* ── Age ────────────────────────────────────────── */}
          <Text style={styles.fieldLabel}>Age</Text>
          <TextInput
            style={[
              styles.input,
              touched.age && errors.age && styles.inputError,
            ]}
            value={age}
            onChangeText={setAge}
            onBlur={() => handleBlur("age")}
            placeholder="yrs"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
          />
          {touched.age && errors.age ? (
            <Text style={styles.errorText}>{errors.age}</Text>
          ) : null}

          {/* ── Height ─────────────────────────────────────── */}
          <Text style={styles.fieldLabel}>Height</Text>
          <TextInput
            style={[
              styles.input,
              touched.height && errors.heightCm && styles.inputError,
            ]}
            value={height}
            onChangeText={setHeight}
            onBlur={() => handleBlur("height")}
            placeholder="cm"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
          />
          {touched.height && errors.heightCm ? (
            <Text style={styles.errorText}>{errors.heightCm}</Text>
          ) : null}

          {/* ── Weight ─────────────────────────────────────── */}
          <Text style={styles.fieldLabel}>Weight</Text>
          <TextInput
            style={[
              styles.input,
              touched.weight && errors.weightKg && styles.inputError,
            ]}
            value={weight}
            onChangeText={setWeight}
            onBlur={() => handleBlur("weight")}
            placeholder="kg"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
          />
          {touched.weight && errors.weightKg ? (
            <Text style={styles.errorText}>{errors.weightKg}</Text>
          ) : null}

          {/* ── Workout Days ───────────────────────────────── */}
          <Text style={styles.fieldLabel}>WORKOUT DAYS PER WEEK</Text>
          <View style={styles.daysRow}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.dayBtn,
                  days === num && styles.dayBtnActive,
                  touched.days &&
                    errors.workoutDaysPerWeek &&
                    styles.dayBtnError,
                ]}
                onPress={() => {
                  setDays(num);
                  handleBlur("days");
                }}
              >
                <Text
                  style={[styles.dayText, days === num && styles.dayTextActive]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {touched.days && errors.workoutDaysPerWeek ? (
            <Text style={styles.errorText}>{errors.workoutDaysPerWeek}</Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Continue" onPress={handleContinue} />
        </View>
      </KeyboardAvoidingView>
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
  fieldLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },

  // Sex toggle
  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  toggleBtnActive: { borderColor: COLORS.primary },
  toggleBtnError: { borderColor: "#E53935" },
  toggleText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "600" },
  toggleTextActive: { color: COLORS.text },

  // Text inputs
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: COLORS.text,
    fontSize: 15,
    marginBottom: 4,
  },
  inputError: {
    borderColor: "#E53935",
    borderWidth: 1.5,
  },

  // Days picker
  daysRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  dayBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  dayBtnActive: { borderColor: COLORS.primary },
  dayBtnError: { borderColor: "#E53935" },
  dayText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: "700" },
  dayTextActive: { color: COLORS.text },

  // Error text below each field
  errorText: {
    color: "#E53935",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 2,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 12 },
});