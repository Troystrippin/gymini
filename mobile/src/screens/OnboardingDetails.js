import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import ProgressBar from "../components/ProgressBar";
import { COLORS } from "../theme/colors";
import { useTheme } from "../theme/theme";

export default function OnboardingDetails({ navigation, route }) {
  const { colors } = useTheme();
  const { goal } = route.params;
  const [sex, setSex] = useState(null);
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [days, setDays] = useState(null);

  const handleContinue = () => {
    if (!sex || !age || !height || !weight || days === null) {
      return Alert.alert("Missing info", "Please fill all fields to continue.");
    }
    navigation.navigate("OnboardingActivity", {
      goal,
      biologicalSex: sex,
      age: parseInt(age),
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

          <Text style={styles.fieldLabel}>BIOLOGICAL SEX</Text>
          <View style={styles.toggleRow}>
            {["Male", "Female"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.toggleBtn,
                  sex === option && styles.toggleBtnActive,
                ]}
                onPress={() => setSex(option)}
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

          <Text style={styles.fieldLabel}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="yrs"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>Height</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            placeholder="cm"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>Weight</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="kg"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>WORKOUT DAYS PER WEEK</Text>
          <View style={styles.daysRow}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.dayBtn, days === num && styles.dayBtnActive]}
                onPress={() => setDays(num)}
              >
                <Text
                  style={[styles.dayText, days === num && styles.dayTextActive]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
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
  toggleText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "600" },
  toggleTextActive: { color: COLORS.text },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: COLORS.text,
    fontSize: 15,
    marginBottom: 20,
  },
  daysRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
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
  dayText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: "700" },
  dayTextActive: { color: COLORS.text },
  footer: { paddingHorizontal: 24, paddingBottom: 12 },
});
