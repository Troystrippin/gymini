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
        <Text
          style={[styles.statLabel, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {label}
        </Text>
        {Icon ? (
          <View style={styles.iconBox}>
            <Icon
              width={22}
              height={22}
              fill={colors.primary}
              color={colors.primary}
            />
          </View>
        ) : null}
      </View>

      <Text
        style={[styles.statValue, { color: colors.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>

      <Text
        style={[styles.statDescription, { color: colors.success }]}
        numberOfLines={2}
      >
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    borderRadius: 18,
    padding: 14,
    minHeight: 50,
    borderLeftWidth: 3,
    overflow: "hidden",
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0,
  },
  iconBox: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
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
