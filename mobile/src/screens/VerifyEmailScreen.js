import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useContext, useEffect } from "react";
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

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, verifyEmail, resendVerification, logout } =
    useContext(AuthContext);

  const handleVerify = async () => {
    if (code.length !== 6) {
      return Alert.alert("Error", "Please enter the 6-digit code");
    }
    setSubmitting(true);
    try {
      await verifyEmail(code);
      // The navigator will automatically switch to the next stack
      // because user.emailVerified becomes true.
    } catch (err) {
      Alert.alert(
        "Verification Failed",
        err.response?.data?.message || "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification(user.email);
      Alert.alert("Sent", "A new code is on the way to your email.");
    } catch (err) {
      Alert.alert(
        "Resend Failed",
        err.response?.data?.message || "Something went wrong",
      );
    }
  };

  const handleLogout = async () => {
    await logout();
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
            Verify your email
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We sent a 6-digit code to {user?.email}. Enter it below.
          </Text>

          <InputField
            label="Verification Code"
            value={code}
            onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ""))}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />

          <Button
            title={submitting ? "Verifying..." : "Verify"}
            onPress={handleVerify}
            disabled={submitting}
          />

          <TouchableOpacity onPress={handleResend} style={styles.linkRow}>
            <Text style={[styles.link, { color: colors.primary }]}>
              Didn't get a code? Resend
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={styles.linkRow}>
            <Text style={[styles.linkMuted, { color: colors.textSecondary }]}>
              Log out
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