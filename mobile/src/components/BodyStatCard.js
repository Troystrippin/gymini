import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function BodyStatCard({
  label,
  value,
  icon: Icon,
  colors,
  style,
  leftBorderColor,
}) {
  return (
    <View
      style={[
        styles.statCard,
        style,
        {
          backgroundColor: colors.background,
          borderLeftColor: leftBorderColor ?? colors.primary,
        },
      ]}
    >
      <View style={styles.statHeader}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        {Icon ? (
          <Icon
            width={22}
            height={22}
            fill={colors.primary}
            color={colors.primary}
          />
        ) : null}
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    minHeight: 50,
    minWidth: 100,
    borderLeftWidth: 3,
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
