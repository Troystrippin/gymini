import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function MealPlanCard({ plan, selected, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{plan.name}</Text>
          <Text style={[styles.goal, { color: colors.textSecondary }]}>
            {plan.goal}
          </Text>
        </View>
        {selected ? (
          <Text style={[styles.selected, { color: colors.primary }]}>
            Selected
          </Text>
        ) : null}
      </View>
      <Text style={[styles.calories, { color: colors.primary }]}>
        {plan.calories}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 12, padding: 16 },
  header: { alignItems: "center", flexDirection: "row" },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: "800" },
  goal: { fontSize: 13, marginTop: 5 },
  selected: { fontSize: 12, fontWeight: "800" },
  calories: { fontSize: 14, fontWeight: "800", marginTop: 16 },
});
