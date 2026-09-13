import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function StatCard({
  label,
  value,
  emoji,
  progress,
  colors,
  style,
}) {
  return (
    <View
      style={[
        styles.statCard,
        style,
        { backgroundColor: colors.cardBackground },
      ]}
    >
      <View style={styles.statHeader}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={styles.statEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <View style={[styles.statBarBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.statBarFill,
            { width: `${progress * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    elevation: 4,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statEmoji: { fontSize: 18 },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 14,
  },
  statBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 3,
  },
});
