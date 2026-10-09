import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../theme/colors";
import { useTheme } from "../theme/theme";

export default function TermsScreen({ navigation }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.subtitle}>Last updated: October 9, 2026</Text>
        </View>

      <Text style={styles.text}>
        Welcome to GYMini. These Terms of Service govern your access to and use
        of the GYMini mobile application, website, and related services operated
        by the GYMini Team.
      </Text>

      <Text style={styles.section}>1. Eligibility</Text>
      <Text style={styles.text}>
        You must be at least 13 years old to use the Service. If you are under
        18, you must have parent or guardian consent and supervision where
        required by law. By using the Service, you represent that you have the
        legal authority to enter into these Terms and that the information you
        provide is accurate and complete.
      </Text>

      <Text style={styles.section}>2. Account Registration</Text>
      <Text style={styles.text}>
        To access certain features, you may need to create an account. You are
        responsible for keeping your password secure and for all activities that
        occur under your account. We reserve the right to suspend or terminate
        accounts that are fraudulent, abusive, or harmful to the Service.
      </Text>

      <Text style={styles.section}>3. Use of the Service</Text>
      <Text style={styles.text}>
        You agree to use the Service only for lawful purposes. You may not copy,
        modify, or distribute our content without permission, harass other
        users, upload harmful content, or attempt to interfere with the
        platform’s security or operations.
      </Text>

      <Text style={styles.section}>4. Fitness and Wellness Disclaimer</Text>
      <Text style={styles.text}>
        GYMINI is designed to help users track workouts, nutrition, exercise,
        and wellness progress. The Service is for informational and motivational
        purposes only and is not a substitute for professional medical,
        nutritional, or fitness advice. You are responsible for your own health
        decisions and should consult a qualified professional before starting a
        new exercise plan or major dietary change.
      </Text>

      <Text style={styles.section}>5. User Content</Text>
      <Text style={styles.text}>
        You may submit content such as workout information, profile details, and
        preferences. By submitting such content, you represent that you own or
        have the right to share it and that it does not violate any third-party
        rights. We may review or remove content that violates these Terms.
      </Text>

      <Text style={styles.section}>6. Intellectual Property</Text>
      <Text style={styles.text}>
        All content, branding, software, design, and materials related to the
        Service are owned by or licensed to us. You may not reproduce, resell,
        reverse engineer, or misuse any part of the Service without permission.
      </Text>

      <Text style={styles.section}>7. Termination</Text>
      <Text style={styles.text}>
        We may suspend or terminate your access to the Service if you violate
        these Terms or if your account is fraudulent, abusive, or harmful to the
        Platform or other users.
      </Text>

      <Text style={styles.section}>8. Disclaimer of Warranties</Text>
      <Text style={styles.text}>
        The Service is provided on an “as is” and “as available” basis. We do
        not guarantee uninterrupted access, error-free operation, or specific
        outcomes from using the App.
      </Text>

      <Text style={styles.section}>9. Limitation of Liability</Text>
      <Text style={styles.text}>
        We are not liable for indirect, incidental, or consequential damages
        arising from your use of the Service, including loss of data, business,
        or personal injury unless required by law.
      </Text>

      <Text style={styles.section}>10. Changes to These Terms</Text>
      <Text style={styles.text}>
        We may update these Terms from time to time. Continued use of the
        Service after changes are posted means you accept the updated version.
      </Text>

      <Text style={styles.text}>
        If you have any questions, please contact us at
        raoc.leocadio.up@phinmaed.com
      </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  section: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  backButton: {
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  backText: {
    color: COLORS.text,
    fontWeight: "700",
  },
});
