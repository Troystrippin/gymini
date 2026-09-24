import React, { useContext, useState } from "react";
import {
  StyleSheet,
  Text,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../theme/theme";
import {
  validateFullName,
  validateAge,
  validateHeight,
  validateWeight,
  validateWorkoutDays,
  showValidationAlert,
} from "../utils/validation";

const LABELS = {
  fullName: "Full Name",
  age: "Age",
  heightCm: "Height",
  weightKg: "Weight",
  workoutDaysPerWeek: "Workout Days / Week",
};

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile, completeOnboarding, refreshUser } =
    useContext(AuthContext);
  const { colors } = useTheme();
  const details = user?.profile?.details || {};

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [age, setAge] = useState(details.age ? String(details.age) : "");
  const [heightCm, setHeightCm] = useState(
    details.heightCm ? String(details.heightCm) : "",
  );
  const [weightKg, setWeightKg] = useState(
    details.weightKg ? String(details.weightKg) : "",
  );
  const [workoutDaysPerWeek, setDays] = useState(
    details.workoutDaysPerWeek ? String(details.workoutDaysPerWeek) : "",
  );

  const [touched, setTouched] = useState({
    fullName: false,
    age: false,
    heightCm: false,
    weightKg: false,
    workoutDaysPerWeek: false,
  });
  const [saving, setSaving] = useState(false);

  const errors = {
    fullName: validateFullName(fullName),
    age: validateAge(age),
    heightCm: validateHeight(heightCm),
    weightKg: validateWeight(weightKg),
    workoutDaysPerWeek: validateWorkoutDays(workoutDaysPerWeek),
  };

  const handleBlur = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSave = async () => {
    setTouched({
      fullName: true,
      age: true,
      heightCm: true,
      weightKg: true,
      workoutDaysPerWeek: true,
    });

    const hasErrors = showValidationAlert(
      "Cannot Save Profile",
      errors,
      LABELS,
    );
    if (hasErrors) return;

    try {
      setSaving(true);

      const trimmedName = fullName.trim();
      if (trimmedName && trimmedName !== user?.fullName) {
        await updateProfile({ fullName: trimmedName });
      }

      const onboardingPayload = {};
      if (age) onboardingPayload.age = Number(age);
      if (heightCm) onboardingPayload.height = Number(heightCm);
      if (weightKg) onboardingPayload.weight = Number(weightKg);
      if (workoutDaysPerWeek)
        onboardingPayload.workoutDaysPerWeek = Number(workoutDaysPerWeek);

      if (Object.keys(onboardingPayload).length) {
        await completeOnboarding(onboardingPayload);
      }

      await refreshUser();

      Alert.alert("Saved", "Profile updated.");
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        "Save failed",
        err.response?.data?.message || err.message || "Something went wrong",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>

        <InputField
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          onBlur={() => handleBlur("fullName")}
          placeholder="Your name"
          error={errors.fullName}
          touched={touched.fullName}
          autoCapitalize="words"
        />
        <InputField
          label="Age"
          value={age}
          onChangeText={setAge}
          onBlur={() => handleBlur("age")}
          keyboardType="numeric"
          placeholder="e.g. 25"
          error={errors.age}
          touched={touched.age}
        />
        <InputField
          label="Height (cm)"
          value={heightCm}
          onChangeText={setHeightCm}
          onBlur={() => handleBlur("heightCm")}
          keyboardType="numeric"
          placeholder="e.g. 175"
          error={errors.heightCm}
          touched={touched.heightCm}
        />
        <InputField
          label="Weight (kg)"
          value={weightKg}
          onChangeText={setWeightKg}
          onBlur={() => handleBlur("weightKg")}
          keyboardType="numeric"
          placeholder="e.g. 70"
          error={errors.weightKg}
          touched={touched.weightKg}
        />
        <InputField
          label="Workout Days / Week"
          value={workoutDaysPerWeek}
          onChangeText={setDays}
          onBlur={() => handleBlur("workoutDaysPerWeek")}
          keyboardType="numeric"
          placeholder="e.g. 4"
          error={errors.workoutDaysPerWeek}
          touched={touched.workoutDaysPerWeek}
        />

        <Button
          title={saving ? "Saving..." : "Save Changes"}
          onPress={handleSave}
          disabled={saving}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 20 },
});