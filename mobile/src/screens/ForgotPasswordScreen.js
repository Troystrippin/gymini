import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { COLORS } from "../theme/colors";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../theme/theme";

export default function ForgotPasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const { forgotPassword, resetPassword } = useContext(AuthContext);

  const [step, setStep] = useState(1); // 1 = email, 2 = code + new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSendCode = async () => {
    if (!email) return Alert.alert("Error", "Please enter your email");
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setStep(2);
      Alert.alert("Check your email", "We sent a 6-digit reset code.");
    } catch (err) {
      Alert.alert(
        "Request Failed",
        err.response?.data?.message || "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (code.length !== 6) {
      return Alert.alert("Error", "Please enter the 6-digit code");
    }
    if (!newPassword || !confirmPassword) {
      return Alert.alert("Error", "Please fill all fields");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }
    setSubmitting(true);
    try {
      await resetPassword(email, code, newPassword);
      Alert.alert(
        "Success",
        "Password updated. Please log in with your new password.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert(
        "Reset Failed",
        err.response?.data?.message || "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <LinearGradient
        colors={[colors.background, colors.primary]}
        start={{ x: 0, y: 0.7 }}
        end={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>◆◆</Text>
          <Text style={styles.brand}>GYMINI</Text>
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>
            {step === 1 ? "Forgot password?" : "Reset password"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {step === 1
              ? "Enter your email and we'll send you a reset code."
              : `Enter the 6-digit code sent to ${email} and pick a new password.`}
          </Text>

          {step === 1 ? (
            <>
              <InputField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="example@gmail.com"
                keyboardType="email-address"
              />
              <Button
                title={submitting ? "Sending..." : "Send Reset Code"}
                onPress={handleSendCode}
                disabled={submitting}
              />
            </>
          ) : (
            <>
              <InputField
                label="Reset Code"
                value={code}
                onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              <InputField
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                secureTextEntry
              />
              <InputField
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry
              />
              <Button
                title={submitting ? "Resetting..." : "Reset Password"}
                onPress={handleReset}
                disabled={submitting}
              />
              <TouchableOpacity
                onPress={handleSendCode}
                style={styles.linkRow}
              >
                <Text style={[styles.link, { color: colors.primary }]}>
                  Resend code
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.linkRow}
          >
            <Text style={[styles.linkMuted, { color: colors.textSecondary }]}>
              Back to sign in
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 50, color: COLORS.text, fontWeight: "bold" },
  brand: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 8,
  },
  body: { width: "100%" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  linkRow: { alignItems: "center", marginTop: 16 },
  link: { fontSize: 14, fontWeight: "600" },
  linkMuted: { fontSize: 13 },
});