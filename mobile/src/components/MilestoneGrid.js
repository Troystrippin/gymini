import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function MilestoneGrid({ milestones, colors }) {
  if (!milestones || milestones.length === 0) return null;

  const unlockedCount = milestones.filter((m) => m.unlocked).length;

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Milestones</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {unlockedCount} / {milestones.length}
        </Text>
      </View>
      <View style={styles.grid}>
        {milestones.map((m) => (
          <View
            key={m.id}
            style={[
              styles.tile,
              {
                backgroundColor: m.unlocked
                  ? colors.accentMuted
                  : colors.background,
                borderColor: m.unlocked ? colors.primary : colors.border,
                opacity: m.unlocked ? 1 : 0.5,
              },
            ]}
          >
            <Text style={styles.emoji}>{m.emoji}</Text>
            <Text
              style={[styles.label, { color: colors.text }]}
              numberOfLines={2}
            >
              {m.label}
            </Text>
            {m.unlocked && (
              <Text style={[styles.check, { color: colors.primary }]}>✓</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    elevation: 4,
    marginTop: 24,
    padding: 14,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "800" },
  count: { fontSize: 13, fontWeight: "700" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 92,
    paddingHorizontal: 6,
    paddingVertical: 10,
    width: "30%",
  },
  emoji: { fontSize: 26, marginBottom: 6 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  check: { fontSize: 14, fontWeight: "800", marginTop: 4 },
});