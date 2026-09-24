import React, { useCallback, useState } from "react";
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

export default function WorkoutHistoryScreen() {
  const { colors } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/workouts/history?limit=30");
      setLogs(res.data.logs || []);
    } catch (err) {
      console.warn("history fetch:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, []),
  );

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchHistory();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Workout History
        </Text>

        {logs.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No workouts logged yet. Finish a session to see it here.
          </Text>
        ) : (
          logs.map((log) => {
            const date = new Date(log.dateCompleted);
            const mins = Math.round((log.durationSec || 0) / 60);
            return (
              <View
                key={log._id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {log.planName}
                  </Text>
                  <Text
                    style={[
                      styles.cardDate,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
                <Text
                  style={[styles.cardMeta, { color: colors.textSecondary }]}
                >
                  {log.completedExercises || 0} of{" "}
                  {log.totalExercises || log.exercisesPerformed.length}{" "}
                  exercises · {mins} min
                </Text>
                <View style={styles.tagRow}>
                  {log.exercisesPerformed.slice(0, 4).map((ex, i) => (
                    <View
                      key={i}
                      style={[
                        styles.tag,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <Text
                        style={[styles.tagText, { color: colors.textSecondary }]}
                      >
                        {ex.name}
                      </Text>
                    </View>
                  ))}
                  {log.exercisesPerformed.length > 4 && (
                    <Text
                      style={[
                        styles.moreTag,
                        { color: colors.textSecondary },
                      ]}
                    >
                      +{log.exercisesPerformed.length - 4} more
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 20 },
  empty: { fontSize: 14, marginTop: 20, textAlign: "center" },
  card: { borderRadius: 14, padding: 16, marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: { fontSize: 17, fontWeight: "800", flex: 1 },
  cardDate: { fontSize: 12, fontWeight: "700" },
  cardMeta: { fontSize: 13, marginTop: 6 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: "700" },
  moreTag: { fontSize: 11, fontWeight: "700", alignSelf: "center" },
});