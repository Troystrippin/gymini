import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ProgressStatCard({
  label,
  value,
  description,
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
      <Text style={[styles.statDescription, { color: colors.success }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
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
    letterSpacing: 0,
  },
  statEmoji: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 14,
  },
  statDescription: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
