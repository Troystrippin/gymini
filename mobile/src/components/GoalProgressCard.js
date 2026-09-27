import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const GOAL_LABELS = {
  weight: "Weight Goal",
  workout_frequency: "Workout Frequency",
};

const formatDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function GoalProgressCard({
  goal,
  onEdit,
  onAbandon,
  onCreate,
  colors,
}) {
  // Empty state — no active goal of this type
  if (!goal) {
    return (
      <View
        style={[styles.card, { backgroundColor: colors.cardBackground }]}
      >
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No active goal
        </Text>
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          Set a target to track your progress.
        </Text>
        <Pressable
          onPress={onCreate}
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.ctaText}>Set a Goal</Text>
        </Pressable>
      </View>
    );
  }

  const p = goal.progress || {};
  const pct = Math.round((p.progress || 0) * 100);
  const deadlineStr = formatDate(goal.deadline);

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {GOAL_LABELS[goal.type] || "Goal"}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {goal.type === "weight"
              ? `Reach ${goal.target} kg`
              : `Work out ${goal.target}×/week`}
          </Text>
        </View>
        <Text style={[styles.pct, { color: colors.primary }]}>{pct}%</Text>
      </View>

      <View style={[styles.track, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, pct)}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.metaText, { color: colors.text }]}>
          {p.label || "—"}
        </Text>
        {deadlineStr && (
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            By {deadlineStr}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onEdit}
          style={[styles.actionBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={onAbandon}
          style={[styles.actionBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            Abandon
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    elevation: 4,
    marginTop: 24,
    padding: 16,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginBottom: 12,
  },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  pct: { fontSize: 22, fontWeight: "800" },
  track: {
    borderRadius: 6,
    height: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  fill: { height: "100%" },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: { fontSize: 13, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionBtn: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  actionText: { fontSize: 13, fontWeight: "700" },
  emptyTitle: { fontSize: 16, fontWeight: "800" },
  emptyHint: { fontSize: 13, marginTop: 6, marginBottom: 14 },
  ctaBtn: {
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 12,
  },
  ctaText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});