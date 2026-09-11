import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";
import { useTheme } from "../theme/theme";

export default function PlaceholderScreen({ title, Icon }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Icon color={colors.primary} size={64} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Coming soon...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 14 },
});
