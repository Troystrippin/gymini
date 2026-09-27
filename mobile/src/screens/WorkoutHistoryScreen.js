import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api/api";
import { useTheme } from "../theme/theme";

// ─── Date helpers ────────────────────────────────────────────────

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const shortMonth = (date) =>
  date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

/**
 * Classify a date into a section key + label.
 * Returns { key, label, order } — order used for sorting sections descending.
 */
const sectionFor = (date) => {
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d >= thisWeekStart) {
    return { key: "this-week", label: "This Week", order: 0 };
  }
  if (d >= lastWeekStart) {
    return { key: "last-week", label: "Last Week", order: 1 };
  }

  const monthStart = startOfMonth(d);
  const monthsAgo = Math.round(
    (startOfMonth(now).getTime() - monthStart.getTime()) /
      (1000 * 60 * 60 * 24 * 30),
  );
  return {
    key: `month-${monthStart.getFullYear()}-${monthStart.getMonth()}`,
    label: shortMonth(monthStart),
    order: 2 + monthsAgo,
  };
};

const formatDateBadge = (date) => {
  const d = new Date(date);
  return {
    day: String(d.getDate()),
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
  };
};

const formatDuration = (sec) => {
  const total = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(total / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
};

// ─── Screen ─────────────────────────────────────────────────────

export default function WorkoutHistoryScreen() {
  const { colors } = useTheme();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [historyRes, statsRes] = await Promise.all([
        api.get("/workouts/history?limit=60"),
        api.get("/workouts/stats").catch(() => null),
      ]);
      setLogs(historyRes.data.logs || []);
      if (statsRes) setStats(statsRes.data);
    } catch (err) {
      console.warn("[history] fetch failed:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  // Group logs into sections (This Week / Last Week / By month)
  const sections = useMemo(() => {
    if (!logs.length) return [];
    const grouped = new Map();
    for (const log of logs) {
      const section = sectionFor(new Date(log.dateCompleted));
      if (!grouped.has(section.key)) {
        grouped.set(section.key, {
          key: section.key,
          label: section.label,
          order: section.order,
          logs: [],
        });
      }
      grouped.get(section.key).logs.push(log);
    }
    return [...grouped.values()].sort((a, b) => a.order - b.order);
  }, [logs]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  const totalSessions = stats?.totalSessions ?? logs.length;
  const totalMinutes = stats?.totalMinutes ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;
  const totalHours = Math.floor(totalMinutes / 60);
  const totalRemMin = totalMinutes % 60;
  const durationLabel =
    totalHours > 0
      ? totalRemMin
        ? `${totalHours}h ${totalRemMin}m`
        : `${totalHours}h`
      : `${totalRemMin}m`;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAll();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Workout History
        </Text>

        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🏋️</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No workouts yet
            </Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              Finish a session to see it here.
            </Text>
          </View>
        ) : (
          <>
            {/* Stats row */}
            <View
              style={[
                styles.statsRow,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {totalSessions}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  SESSIONS
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {durationLabel}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  TOTAL TIME
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {currentStreak}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  STREAK
                </Text>
              </View>
            </View>

            {/* Grouped sections */}
            {sections.map((section) => (
              <View key={section.key} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[styles.sectionLabel, { color: colors.text }]}
                  >
                    {section.label}
                  </Text>
                  <Text
                    style={[
                      styles.sectionCount,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {section.logs.length}{" "}
                    {section.logs.length === 1 ? "session" : "sessions"}
                  </Text>
                </View>

                {section.logs.map((log) => {
                  const badge = formatDateBadge(log.dateCompleted);
                  const mins = Math.round((log.durationSec || 0) / 60);
                  const exercises = log.exercisesPerformed || [];
                  const completedCount =
                    log.completedExercises ?? exercises.filter((e) => e.completed).length;
                  const totalExercises =
                    log.totalExercises ?? exercises.length;

                  return (
                    <View
                      key={log._id}
                      style={[
                        styles.card,
                        { backgroundColor: colors.cardBackground },
                      ]}
                    >
                      <View
                        style={[
                          styles.dateBadge,
                          { backgroundColor: colors.background },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateBadgeWeekday,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {badge.weekday}
                        </Text>
                        <Text
                          style={[
                            styles.dateBadgeDay,
                            { color: colors.text },
                          ]}
                        >
                          {badge.day}
                        </Text>
                      </View>

                      <View style={styles.cardBody}>
                        <Text
                          style={[styles.cardTitle, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {log.planName}
                        </Text>
                        <Text
                          style={[
                            styles.cardMeta,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {completedCount} of {totalExercises} exercises ·{" "}
                          {mins > 0 ? `${mins} min` : formatDuration(log.durationSec)}
                        </Text>

                        {exercises.length > 0 && (
                          <View style={styles.tagRow}>
                            {exercises.slice(0, 3).map((ex, i) => (
                              <View
                                key={i}
                                style={[
                                  styles.tag,
                                  { backgroundColor: colors.background },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.tagText,
                                    { color: colors.textSecondary },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {ex.name}
                                </Text>
                              </View>
                            ))}
                            {exercises.length > 3 && (
                              <Text
                                style={[
                                  styles.moreTag,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                +{exercises.length - 3}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 20 },

  // Stats row
  statsRow: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 24,
    padding: 16,
  },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  statDivider: { height: 32, width: 1 },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 17, fontWeight: "800" },
  sectionCount: { fontSize: 12, fontWeight: "700" },

  // Session card
  card: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 10,
    padding: 14,
  },
  dateBadge: {
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    minWidth: 54,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 14,
  },
  dateBadgeWeekday: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dateBadgeDay: { fontSize: 22, fontWeight: "800", marginTop: 2 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardMeta: { fontSize: 12, marginTop: 4 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: {
    borderRadius: 8,
    maxWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontSize: 11, fontWeight: "700" },
  moreTag: { fontSize: 11, fontWeight: "700", alignSelf: "center" },

  // Empty state
  emptyState: { alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  emptyHint: { fontSize: 13 },
});