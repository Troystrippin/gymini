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
  validateCurrentPassword,
  validatePassword,
  validateConfirmPassword,
  showValidationAlert,
} from "../utils/validation";

const LABELS = {
  current: "Current Password",
  next: "New Password",
  confirm: "Confirm Password",
};

export default function ChangePasswordScreen({ navigation }) {
  const { changePassword } = useContext(AuthContext);
  const { colors } = useTheme();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [saving, setSaving] = useState(false);

  const errors = {
    current: validateCurrentPassword(current),
    next: validatePassword(next),
    confirm: validateConfirmPassword(confirm, next),
  };

  // Extra: new password can't equal current
  if (!errors.next && current && next && next === current) {
    errors.next = "New password must be different from current";
  }

  const handleBlur = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSave = async () => {
    setTouched({ current: true, next: true, confirm: true });

    const hasErrors = showValidationAlert(
      "Cannot Update Password",
      errors,
      LABELS,
    );
    if (hasErrors) return;

    try {
      setSaving(true);
      await changePassword(current, next);
      Alert.alert("Success", "Password updated.");
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        "Failed",
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
        <Text style={[styles.title, { color: colors.text }]}>
          Change Password
        </Text>

        <InputField
          label="Current Password"
          value={current}
          onChangeText={setCurrent}
          onBlur={() => handleBlur("current")}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Enter current password"
          error={errors.current}
          touched={touched.current}
        />
        <InputField
          label="New Password"
          value={next}
          onChangeText={setNext}
          onBlur={() => handleBlur("next")}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="At least 8 chars, 1 letter, 1 number"
          error={errors.next}
          touched={touched.next}
        />
        <InputField
          label="Confirm New Password"
          value={confirm}
          onChangeText={setConfirm}
          onBlur={() => handleBlur("confirm")}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Repeat new password"
          error={errors.confirm}
          touched={touched.confirm}
        />

        <Button
          title={saving ? "Updating..." : "Update Password"}
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