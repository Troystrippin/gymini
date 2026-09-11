import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme";

export default function ProgressBar({ step, totalSteps }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor: index < step ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {step} of {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  barContainer: { flex: 1, flexDirection: "row", gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  text: { fontSize: 13, marginLeft: 12 },
});
