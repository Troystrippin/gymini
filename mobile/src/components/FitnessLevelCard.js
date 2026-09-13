import React from "react";
import { StyleSheet, Text, View } from "react-native";

const LEVELS = ["Beginner", "Intermediate", "Advance"];

export default function FitnessLevelCard({ fitnessLevel, colors }) {
  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Fitness Level</Text>
      <View style={styles.levels}>
        {LEVELS.map((level) => {
          const isActive = level === fitnessLevel;

          return (
            <View
              key={level}
              style={[
                styles.level,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.background,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.levelText,
                  { color: isActive ? "#FFFFFF" : colors.textSecondary },
                ]}
              >
                {level}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    elevation: 4,
    marginTop: 24,
    padding: 14,
  },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  levels: { flexDirection: "row", gap: 10 },
  level: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 8,
  },
  levelText: { fontSize: 13, fontWeight: "700" },
});
