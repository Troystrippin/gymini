import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
} from "react-native-nitro-google-signin";
import { LinearGradient } from "expo-linear-gradient";
import Button from "../components/Button";
import InputField from "../components/InputField";
import GYMINI_LOGO from "../icons/GYMINI_LOGO";
import { COLORS } from "../theme/colors";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../theme/theme";
import {
  validateEmail,
  validateCurrentPassword,
  showValidationAlert,
} from "../utils/validation";

const LABELS = {
  email: "Email",
  password: "Password",
};

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const { login, googleLogin, sessionExpired, clearSessionExpired } =
    useContext(AuthContext);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (sessionExpired && (email || password)) clearSessionExpired();
  }, [email, password, sessionExpired, clearSessionExpired]);

  const errors = {
    email: validateEmail(email),
    password: validateCurrentPassword(password),
  };

  const handleBlur = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleLogin = async () => {
    setTouched({ email: true, password: true });

    const hasErrors = showValidationAlert("Login Failed", errors, LABELS);
    if (hasErrors) return;

    try {
      setSubmitting(true);
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      if (err.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        // Redirect to VerifyEmail screen if the backend says they are unverified
        navigation.navigate("VerifyEmail", { email: email.trim().toLowerCase() });
        return;
      }
      Alert.alert(
        "Login Failed",
        err.response?.data?.message || err.message || "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      await GoogleOneTapSignIn.checkPlayServices();

      let response = await GoogleOneTapSignIn.signIn();

      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.createAccount();
      }

      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.presentExplicitSignIn();
      }

      if (isCancelledResponse(response)) return;

      if (!isSuccessResponse(response) || !response.data.idToken) {
        throw new Error("Google did not return an ID token. Please try again");
      }
      await googleLogin(response.data.idToken);
    } catch (err) {
      Alert.alert(
        "Google Sign-In Failed",
        err.response?.data?.message || err.message || "Please try again.",
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
          <GYMINI_LOGO width={75} height={75} color={colors.text} />
          <Text style={styles.brand}>GYMINI</Text>
        </View>

        {sessionExpired && (
          <View style={styles.expiredBanner}>
            <Text style={styles.expiredText}>
              Your session expired. Please log in again.
            </Text>
          </View>
        )}

        <View
          style={[
            styles.tabContainer,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View
            style={[
              styles.tab,
              styles.tabActive,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.tabActiveText, { color: colors.text }]}>
              Sign in
            </Text>
          </View>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          onBlur={() => handleBlur("email")}
          placeholder="example@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
          touched={touched.email}
        />
        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          onBlur={() => handleBlur("password")}
          placeholder="Enter your password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.password}
          touched={touched.password}
        />

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View
              style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
            />
            <Text style={styles.remember}>Remember me</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <Button
          title={submitting ? "Logging in..." : "Login"}
          onPress={handleLogin}
          disabled={submitting}
        />

        <TouchableOpacity onPress={() => navigation.navigate("Terms")}>
          <Text style={styles.termsLink}>Terms of Service</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={submitting}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 32 },
  brand: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 8,
  },
  expiredBanner: {
    backgroundColor: "rgba(255, 100, 100, 0.15)",
    borderColor: "rgba(255, 100, 100, 0.4)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  expiredText: {
    color: "#ff6b6b",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  remember: { color: COLORS.textSecondary, fontSize: 13 },
  rememberRow: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  forgot: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
  termsLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
  },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
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