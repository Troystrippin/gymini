import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/theme";
import { exercisesApi } from "../api/exercises";
import ExerciseDetailModal from "../components/ExerciseDetailModal";
import { usePlanDraft } from "../context/PlanDraftContext";

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { isInDraft } = usePlanDraft();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeExercise, setActiveExercise] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await exercisesApi.listFavorites(1, 50);
      setItems(data.favorites || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load favorites");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onUnfavorite = async (exerciseId) => {
    const prev = items;
    setItems((cur) => cur.filter((f) => f.exercise._id !== exerciseId));
    try {
      await exercisesApi.unfavorite(exerciseId);
    } catch {
      setItems(prev);
    }
  };

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
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Favorites</Text>
        <View style={styles.headerSpacer} />
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={[styles.error, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity
            onPress={load}
            style={[styles.retry, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyStar}>{"\u2605"}</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No favorites yet
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            Tap the star on any exercise to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const inDraft = isInDraft(item.exercise._id);
            return (
              <TouchableOpacity
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setActiveExercise(item.exercise)}
                activeOpacity={0.7}
              >
                <View style={styles.rowInfo}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {item.exercise.name}
                  </Text>
                  <Text
                    style={[styles.meta, { color: colors.textSecondary }]}
                  >
                    {item.exercise.muscleGroup} - {item.exercise.difficulty}
                  </Text>
                  {inDraft ? (
                    <Text
                      style={[
                        styles.inDraftBadge,
                        { color: colors.accent },
                      ]}
                    >
                      In plan
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => onUnfavorite(item.exercise._id)}
                  hitSlop={10}
                >
                  <Text style={styles.star}>{"\u2605"}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <ExerciseDetailModal
        visible={!!activeExercise}
        exercise={activeExercise}
        onClose={() => setActiveExercise(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBtn: { fontSize: 15, minWidth: 60 },
  headerSpacer: { minWidth: 60 },
  title: { fontSize: 17, fontWeight: "700" },
  list: { padding: 20, paddingTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  inDraftBadge: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  star: { fontSize: 22, color: "#f5a623", paddingHorizontal: 8 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStar: { fontSize: 44, color: "#f5a623", marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptyBody: { fontSize: 13, textAlign: "center" },
  error: { fontSize: 14, marginBottom: 12, textAlign: "center" },
  retry: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
});