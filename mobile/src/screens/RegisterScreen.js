import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { COLORS } from "../theme/colors";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../theme/theme";

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!fullName || !email || !password)
      return Alert.alert("Error", "Please fill all fields");
    try {
      await register(fullName, email, password);
    } catch (err) {
      Alert.alert(
        "Registration Failed",
        err.response?.data?.message || "Something went wrong",
      );
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

        <View
          style={[
            styles.tabContainer,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <TouchableOpacity
            style={styles.tab}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }]}>
              Sign in
            </Text>
          </TouchableOpacity>
          <View
            style={[
              styles.tab,
              styles.tabActive,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.tabActiveText, { color: colors.text }]}>
              Create Account
            </Text>
          </View>
        </View>

        <InputField
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Kent Rashaun Sison"
        />
        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="example@gmail.com"
          keyboardType="email-address"
        />
        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
        />

        <Button
          title="Create Account"
          onPress={handleRegister}
          style={{ marginTop: 16 }}
        />

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[
              styles.socialBtn,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.socialText, { color: colors.text }]}>
              G Google
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.socialBtn,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.socialText, { color: colors.text }]}>
              f Facebook
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
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 50, color: COLORS.text, fontWeight: "bold" },
  brand: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: COLORS.primary },
  tabActiveText: { color: COLORS.text, fontWeight: "700" },
  tabText: { color: COLORS.textSecondary, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: {
    color: COLORS.textSecondary,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialText: { color: COLORS.text, fontWeight: "600" },
});
