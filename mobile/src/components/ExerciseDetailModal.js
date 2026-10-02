import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/theme";
import { usePlanDraft } from "../context/PlanDraftContext";
import FavoriteButton from "./FavoriteButton";

const ACCENT_TEXT = "#FFFFFF";

export default function ExerciseDetailModal({
  visible,
  exercise,
  onClose,
  onTogglePlan,
}) {
  const { colors } = useTheme();
  const { addExercise, removeExercise, isInDraft } = usePlanDraft();

  if (!exercise) return null;

  const inDraft = isInDraft(exercise._id);

  const handleTogglePlan = () => {
    if (typeof onTogglePlan === "function") {
      onTogglePlan(exercise);
    } else if (inDraft) {
      removeExercise(exercise._id);
    } else {
      addExercise(exercise);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {exercise.mediaUrl ? (
            <Image source={{ uri: exercise.mediaUrl }} style={styles.media} />
          ) : (
            <LinearGradient
              colors={[colors.card, colors.background]}
              style={styles.media}
            >
              <Text
                style={[styles.mediaText, { color: colors.textSecondary }]}
              >
                {exercise.muscleGroup}
              </Text>
            </LinearGradient>
          )}

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={2}
              >
                {exercise.name}
              </Text>
              <FavoriteButton exerciseId={exercise._id} size={28} />
            </View>

            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {exercise.muscleGroup} - {exercise.equipment} -{" "}
              {exercise.difficulty}
            </Text>

            <Text style={[styles.description, { color: colors.text }]}>
              {exercise.description || "No description provided."}
            </Text>

            <TouchableOpacity
              style={[
                styles.addBtn,
                {
                  backgroundColor: inDraft ? colors.card : colors.accent,
                  borderWidth: inDraft ? 1 : 0,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleTogglePlan}
            >
              <Text
                style={[
                  styles.addBtnText,
                  {
                    color: inDraft ? colors.textSecondary : ACCENT_TEXT,
                  },
                ]}
              >
                {inDraft ? "Remove from Plan" : "Add to Plan"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  media: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaText: { fontSize: 14 },
  body: { padding: 20 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 20, flex: 1, marginRight: 8 },
  meta: { fontSize: 13, marginBottom: 14 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  addBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addBtnText: { fontSize: 15, fontWeight: "600" },
});