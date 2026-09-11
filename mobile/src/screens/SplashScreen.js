import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, StyleSheet } from "react-native";
import Button from "../components/Button";
import { useTheme } from "../theme/theme";

export default function SplashScreen({ navigation }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.primary]}
        start={{ x: 0, y: 0.7 }}
        end={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.centerContent}>
        <Text style={[styles.logo, { color: colors.text }]}>◆◆</Text>
        <Text style={[styles.brand, { color: colors.text }]}>GYMINI</Text>
        <Text style={[styles.tagline, { color: colors.text }]}>
          IMPROVE YOUR LIFESTYLE
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          GYMini aims to help you achieve your fitness goals with personalized
          workout plans and nutrition guidance.
        </Text>
      </View>
      <Button
        title="GET STARTED"
        onPress={() => navigation.navigate("Login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { fontSize: 80, fontWeight: "bold" },
  brand: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 20,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 20,
  },
});
