import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api/api";
import { workoutProgressApi, todayKey } from "../api/workoutProgressApi";
import { useTheme } from "../theme/theme";

export default function WorkoutSessionScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [setResults, setSetResults] = useState({});

  const startedAtRef = useRef(new Date().toISOString());
  const saveTimerRef = useRef(null);

  const fetchWorkout = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/workouts/today");
      const plan = response.data;

      let savedIds = [];
      let savedSets = {};
      try {
        const progress = await workoutProgressApi.get(plan._id, todayKey());
        savedIds = progress.completedExerciseIds || [];
        savedSets = progress.setResults || {};
      } catch (err) {
        console.warn("[session] failed to load progress:", err.message);
      }

      const savedIdSet = new Set(savedIds.map(String));
      setWorkout({
        ...plan,
        exercises: plan.exercises.map((ex) => ({
          ...ex,
          done: savedIdSet.has(String(ex._id)),
        })),
      });

      setSetResults((current) => {
        const next = { ...current };
        for (const exercise of plan.exercises) {
          const saved = savedSets[String(exercise._id)];
          if (Array.isArray(saved) && saved.length) {
            next[exercise._id] = saved.map((s) => ({
              reps: s.reps ? String(s.reps) : "",
              weight: s.weightKg ? String(s.weightKg) : "",
            }));
          } else if (!next[exercise._id]) {
            next[exercise._id] = Array.from(
              { length: getPlannedSetCount(exercise.sets) },
              () => ({ reps: "", weight: "" }),
            );
          }
        }
        return next;
      });
    } catch (error) {
      Alert.alert(
        "Workout unavailable",
        error.response?.data?.message || "Could not load this workout.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWorkout();
    }, [fetchWorkout]),
  );

  useEffect(() => {
    const timer = setInterval(
      () => setElapsedSeconds((s) => s + 1),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  const persistProgress = useCallback((nextWorkout, nextSets) => {
    if (!nextWorkout?._id) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        const completedExerciseIds = nextWorkout.exercises
          .filter((e) => e.done)
          .map((e) => String(e._id));

        const setResultsPayload = {};
        for (const exercise of nextWorkout.exercises) {
          const rows = nextSets[exercise._id] || [];
          setResultsPayload[String(exercise._id)] = rows.map((r) => ({
            reps: Number(r.reps) || 0,
            weightKg: Number(r.weight) || 0,
          }));
        }

        await workoutProgressApi.save({
          planId: nextWorkout._id,
          date: todayKey(),
          completedExerciseIds,
          setResults: setResultsPayload,
        });
      } catch (err) {
        console.warn("[session] failed to save progress:", err.message);
      }
    }, 500);
  }, []);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const toggleExercise = (exerciseId) => {
    setWorkout((current) => {
      const next = {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise._id === exerciseId
            ? { ...exercise, done: !exercise.done }
            : exercise,
        ),
      };
      persistProgress(next, setResults);
      return next;
    });
  };

  const updateSetResult = (exerciseId, setIndex, field, value) => {
    setSetResults((current) => {
      const next = {
        ...current,
        [exerciseId]: current[exerciseId].map((set, index) =>
          index === setIndex
            ? { ...set, [field]: value.replace(/[^0-9.]/g, "") }
            : set,
        ),
      };
      persistProgress(workout, next);
      return next;
    });
  };

  const finishWorkout = async () => {
    if (saving || !workout) return;

    const exercisesPayload = workout.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId || null,
      name: exercise.name,
      muscleGroup: exercise.muscle || null,
      targetSets: exercise.plannedSets || getPlannedSetCount(exercise.sets),
      targetReps:
        exercise.plannedReps || Number(getPlannedReps(exercise.sets)) || 0,
      completed: !!exercise.done,
      sets: (setResults[exercise._id] || []).map((set) => ({
        reps: Number(set.reps) || 0,
        weightKg: Number(set.weight) || 0,
      })),
    }));

    const setsLogged = exercisesPayload.reduce(
      (sum, e) => sum + e.sets.length,
      0,
    );

    const doSave = async () => {
      try {
        setSaving(true);

        await api.post("/workouts/sessions", {
          planId: workout._id,
          planName: workout.title,
          startedAt: startedAtRef.current,
          durationSec: elapsedSeconds,
          exercises: exercisesPayload,
        });

        const completedExerciseIds = workout.exercises
          .filter((e) => e.done)
          .map((e) => String(e._id));
        const setResultsPayload = {};
        for (const exercise of workout.exercises) {
          const rows = setResults[exercise._id] || [];
          setResultsPayload[String(exercise._id)] = rows.map((r) => ({
            reps: Number(r.reps) || 0,
            weightKg: Number(r.weight) || 0,
          }));
        }
        await workoutProgressApi.save({
          planId: workout._id,
          date: todayKey(),
          completedExerciseIds,
          setResults: setResultsPayload,
        });

        Alert.alert(
          "Workout saved",
          `${completedCount} of ${workout.exercises.length} exercises · ${setsLogged} sets · ${Math.floor(elapsedSeconds / 60)} min`,
        );
        navigation.navigate("PlanList");
      } catch (error) {
        Alert.alert(
          "Save failed",
          error.response?.data?.message || error.message,
        );
      } finally {
        setSaving(false);
      }
    };

    Alert.alert(
      "Finish workout?",
      `${completedCount} of ${workout.exercises.length} exercises completed.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Finish", onPress: doSave },
      ],
    );
  };

  if (loading || !workout) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      </SafeAreaView>
    );
  }

  const completedCount = workout.exercises.filter((e) => e.done).length;
  const isComplete = completedCount === workout.exercises.length;
  const duration = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.navigate("PlanList")}>
          <Text style={[styles.back, { color: colors.textSecondary }]}>
            ← Back to Plans
          </Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>
          {workout.title}
        </Text>
        <Text style={[styles.progress, { color: colors.textSecondary }]}>
          {completedCount} of {workout.exercises.length} exercises complete
        </Text>

        <View
          style={[
            styles.durationCard,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
            WORKOUT DURATION
          </Text>
          <Text style={[styles.durationValue, { color: colors.text }]}>
            {duration}
          </Text>
        </View>

        <View style={styles.list}>
          {workout.exercises.map((exercise, index) => (
            <View
              key={exercise._id}
              style={[
                styles.exercise,
                {
                  backgroundColor: exercise.done
                    ? colors.accentMuted || colors.cardBackground
                    : colors.cardBackground,
                  borderColor: exercise.done ? colors.primary : colors.border,
                },
              ]}
            >
              <Pressable
                onPress={() => toggleExercise(exercise._id)}
                style={styles.exerciseHeader}
              >
                <View
                  style={[
                    styles.check,
                    {
                      backgroundColor: exercise.done
                        ? colors.primary
                        : "transparent",
                      borderColor: exercise.done
                        ? colors.primary
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {exercise.done ? (
                    <Text style={styles.checkMark}>✓</Text>
                  ) : null}
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>
                    {index + 1}. {exercise.name}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseMeta,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {exercise.muscle || "Full body"} · {exercise.sets}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.setList}>
                {(setResults[exercise._id] || []).map((set, setIndex) => (
                  <View key={setIndex} style={styles.setRow}>
                    <Text style={[styles.setNumber, { color: colors.text }]}>
                      Set {setIndex + 1}
                    </Text>
                    <TextInput
                      value={set.reps}
                      placeholder={getPlannedReps(exercise.sets)}
                      placeholderTextColor={colors.textSecondary}
                      onChangeText={(value) =>
                        updateSetResult(exercise._id, setIndex, "reps", value)
                      }
                      keyboardType="number-pad"
                      style={[
                        styles.sessionInput,
                        styles.setInput,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                    />
                    <TextInput
                      value={set.weight}
                      placeholder="kg"
                      placeholderTextColor={colors.textSecondary}
                      onChangeText={(value) =>
                        updateSetResult(exercise._id, setIndex, "weight", value)
                      }
                      keyboardType="decimal-pad"
                      style={[
                        styles.sessionInput,
                        styles.setInput,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={finishWorkout}
          disabled={saving}
          style={[
            styles.finishButton,
            { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.finishText}>
              {isComplete ? "Finish Workout" : "Finish for Now"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function getPlannedSetCount(sets = "") {
  const plannedSets = Number.parseInt(String(sets).split("×")[0], 10);
  return Number.isNaN(plannedSets) ? 1 : plannedSets;
}

function getPlannedReps(sets = "") {
  const plannedReps = Number.parseInt(String(sets).split("×")[1], 10);
  return Number.isNaN(plannedReps) ? "" : String(plannedReps);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  back: { fontSize: 15, fontWeight: "700", marginBottom: 24 },
  title: { fontSize: 30, fontWeight: "800" },
  progress: { fontSize: 14, marginTop: 6 },
  durationCard: { borderRadius: 14, marginTop: 20, padding: 16 },
  durationLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  durationValue: { fontSize: 30, fontWeight: "800", marginTop: 6 },
  list: { gap: 12, marginTop: 28 },
  exercise: { borderRadius: 14, borderWidth: 1, padding: 14 },
  exerciseHeader: {
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  check: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  checkMark: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  exerciseInfo: { flex: 1, marginLeft: 14 },
  exerciseName: { fontSize: 16, fontWeight: "700" },
  exerciseMeta: { fontSize: 13, marginTop: 5 },
  setList: { gap: 8, marginTop: 14 },
  setRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  setNumber: { fontSize: 13, fontWeight: "700", width: 48 },
  sessionInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  setInput: { flex: 1, minWidth: 0 },
  finishButton: {
    alignItems: "center",
    borderRadius: 12,
    marginTop: 28,
    padding: 16,
  },
  finishText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});