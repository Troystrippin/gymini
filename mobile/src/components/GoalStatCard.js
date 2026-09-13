import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function GoalStatCard({
  goals,
  selectedGoal,
  onSelect,
  colors,
}) {
  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Your Goals</Text>
      <View style={styles.options}>
        {goals.map((goal) => {
          const isSelected = selectedGoal === goal.id;

          return (
            <Pressable
              key={goal.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(goal.id)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isSelected
                    ? colors.accentMuted
                    : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={styles.icon}>{goal.icon}</Text>
              <Text
                style={[styles.label, { color: colors.text }]}
                numberOfLines={1}
              >
                {goal.label}
              </Text>
              {isSelected && (
                <Text style={[styles.check, { color: colors.primary }]}>✓</Text>
              )}
            </Pressable>
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
  options: { gap: 10 },
  option: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: 14,
  },
  icon: { fontSize: 20, marginRight: 10 },
  label: { flex: 1, fontSize: 15, fontWeight: "700" },
  check: { fontSize: 20, fontWeight: "800" },
});
