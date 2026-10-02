import React, { useContext, useState } from "react";
import {
  Image,
  View,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import * as ImagePicker from "expo-image-picker";
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
  const [avatarAsset, setAvatarAsset] = useState(null);

  const errors = {
    fullName: validateFullName(fullName),
    age: validateAge(age),
    heightCm: validateHeight(heightCm),
    weightKg: validateWeight(weightKg),
    workoutDaysPerWeek: validateWorkoutDays(workoutDaysPerWeek),
  };

  const handleBlur = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const chooseAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Allow photo access to choose an avatar.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) setAvatarAsset(result.assets[0]);
  };

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

      if (avatarAsset) {
        const formData = new FormData();
        formData.append("image", {
          uri: avatarAsset.uri,
          name: avatarAsset.fileName || "avatar.jpg",
          type: avatarAsset.mimeType || "image/jpeg",
        });
        await api.put("/auth/profile/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
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

        <TouchableOpacity
          onPress={chooseAvatar}
          style={styles.avatarPicker}
          accessibilityRole="button"
        >
          {avatarAsset?.uri || user?.avatarUrl ? (
            <Image
              source={{ uri: avatarAsset?.uri || user.avatarUrl }}
              style={styles.avatarPreview}
            />
          ) : (
            <View
              style={[styles.avatarPreview, { backgroundColor: colors.card }]}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Photo
              </Text>
            </View>
          )}
          <Text style={{ color: colors.accent, fontWeight: "700" }}>
            {avatarAsset ? "Change profile photo" : "Choose profile photo"}
          </Text>
        </TouchableOpacity>

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
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          disabled={saving}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 24 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 20 },
  avatarPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  avatarPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
