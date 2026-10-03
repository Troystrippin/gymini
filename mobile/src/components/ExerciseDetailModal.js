import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
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
  favorited,
  onFavoriteChange,
}) {
  const { colors } = useTheme();
  const { addExercise, removeExercise, isInDraft } = usePlanDraft();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    setDescriptionExpanded(false);
  }, [exercise?._id, visible]);

  if (!exercise) return null;

  const inDraft = isInDraft(exercise._id);
  const description = exercise.description || "No description provided.";
  const showReadMore =
    description.length > 240 || description.split(/\r?\n/).length > 4;

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
          <View style={styles.topBar}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {exercise.mediaUrl ? (
            <Image source={{ uri: exercise.mediaUrl }} style={styles.media} />
          ) : (
            <LinearGradient
              colors={[colors.card, colors.background]}
              style={styles.media}
            >
              <Text style={[styles.mediaText, { color: colors.textSecondary }]}>
                {exercise.muscleGroup}
              </Text>
            </LinearGradient>
          )}

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator
          >
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={2}
              >
                {exercise.name}
              </Text>
              <FavoriteButton
                exerciseId={exercise._id}
                size={28}
                initialFavorited={favorited}
                onFavoriteChange={onFavoriteChange}
              />
            </View>

            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {exercise.muscleGroup} - {exercise.equipment} -{" "}
              {exercise.difficulty}
            </Text>

            <Text
              style={[styles.description, { color: colors.text }]}
              numberOfLines={
                showReadMore && !descriptionExpanded ? 5 : undefined
              }
            >
              {description}
            </Text>
            {showReadMore && (
              <TouchableOpacity
                onPress={() => setDescriptionExpanded((expanded) => !expanded)}
                accessibilityRole="button"
                accessibilityLabel={
                  descriptionExpanded ? "Read less" : "Read more"
                }
                style={styles.readMoreButton}
              >
                <Text style={[styles.readMoreText, { color: colors.accent }]}>
                  {descriptionExpanded ? "Read less" : "Read more"}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
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
              accessibilityRole="button"
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
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Return to exercises"
              style={[
                styles.returnButton,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Text style={[styles.returnText, { color: colors.text }]}>
                Return
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
  topBar: {
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  media: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaText: { fontSize: 14 },
  scrollArea: { flexShrink: 1 },
  body: { padding: 20, paddingBottom: 8 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 20, flex: 1, marginRight: 8, fontWeight: "600" },
  meta: { fontSize: 13, marginBottom: 14 },
  description: { fontSize: 14, lineHeight: 20 },
  readMoreButton: { alignSelf: "flex-start", paddingVertical: 10 },
  readMoreText: { fontSize: 14, fontWeight: "600" },
  footer: {
    gap: 10,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addBtnText: { fontSize: 15, fontWeight: "600" },
  returnButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  returnText: { fontSize: 15, fontWeight: "600" },
});
