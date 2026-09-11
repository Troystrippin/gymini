import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme";

export default function SelectionCard({
  icon,
  title,
  subtitle,
  isSelected,
  onPress,
}) {
  const { colors } = useTheme();
  const Icon = typeof icon === "function" ? icon : null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.cardBackground },
        isSelected && { borderColor: colors.primary },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {Icon ? (
        <View style={styles.icon}>
          <Icon color={colors.primary} size={32} />
        </View>
      ) : (
        <Text style={styles.icon}>{icon}</Text>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  icon: { fontSize: 28, marginRight: 16 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  subtitle: { fontSize: 13 },
});
