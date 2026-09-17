import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function WorkoutCard({
  workout,
  exercises,
  progress,
  onPress,
  colors,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.workoutCard, { backgroundColor: colors.cardBackground }]}
    >
      <View style={styles.workoutHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.workoutLabel, { color: colors.textSecondary }]}>
            TODAY'S WORKOUT
          </Text>
          <Text style={[styles.workoutTitle, { color: colors.text }]}>
            {workout.title}
          </Text>
        </View>
        <ProgressRing progress={progress} colors={colors} />
      </View>

      <View style={styles.exerciseList}>
        {exercises.map((exercise) => (
          <ExerciseRow key={exercise._id} exercise={exercise} colors={colors} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

function ProgressRing({ progress, colors }) {
  const size = 76;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.progressRing}>
      <Svg width={size} height={size} style={styles.progressSvg}>
        <Circle
          stroke={colors.border}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={colors.primary}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.progressText, { color: colors.text }]}>
        {Math.round(progress * 100)}%
      </Text>
    </View>
  );
}

function ExerciseRow({ exercise, colors }) {
  return (
    <View
      style={[
        styles.exerciseRow,
        { backgroundColor: colors.background, borderColor: "transparent" },
        exercise.done && {
          backgroundColor: colors.accentMuted,
          borderColor: colors.primary,
        },
      ]}
    >
      <View
        style={[
          styles.checkCircle,
          { borderColor: colors.textSecondary },
          exercise.done && {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
        ]}
      >
        {exercise.done && <Text style={styles.checkMark}>✓</Text>}
      </View>
      <View style={styles.exerciseInfo}>
        <Text
          style={[
            styles.exerciseName,
            { color: exercise.done ? colors.textSecondary : colors.text },
            exercise.done && styles.exerciseNameDone,
          ]}
        >
          {exercise.name}
        </Text>
        <Text style={[styles.exerciseMuscle, { color: colors.textSecondary }]}>
          {exercise.muscle || "—"}
        </Text>
      </View>
      <Text style={[styles.exerciseSets, { color: colors.textSecondary }]}>
        {exercise.sets || ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  workoutCard: {
    borderRadius: 20,
    padding: 18,
    elevation: 4,
  },
  workoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  workoutLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  workoutTitle: { fontSize: 22, fontWeight: "800" },
  progressRing: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  progressSvg: { position: "absolute" },
  progressText: { fontSize: 14, fontWeight: "800" },
  exerciseList: { gap: 10 },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { color: "#fff", fontSize: 14, fontWeight: "900" },
  exerciseInfo: { flex: 1, marginLeft: 14 },
  exerciseName: { fontSize: 15, fontWeight: "700" },
  exerciseNameDone: {
    textDecorationLine: "line-through",
  },
  exerciseMuscle: { fontSize: 12, marginTop: 2 },
  exerciseSets: {
    fontSize: 14,
    fontWeight: "700",
  },
});
