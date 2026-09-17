import React, { useState, useCallback } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/theme";
import { usePlanDraft } from "../context/PlanDraftContext";
import Stepper from "../components/Stepper";
import api from "../api/api";

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Core",
  "Arms",
  "Full Body",
  "Cardio",
];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function PlanScreen() {
  const { colors } = useTheme();
  const accentTextColor = "#FFFFFF";
  const navigation = useNavigation();

  const {
    draftExercises,
    removeExercise,
    updateExercise,
    addCustomExercise,
    replaceDraft,
    savePlan,
    savingPlan,
  } = usePlanDraft();

  const [planName, setPlanName] = useState("");
  const [savedPlans, setSavedPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activeSavedPlan, setActiveSavedPlan] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);

  // Custom exercise modal
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customGroup, setCustomGroup] = useState("Chest");
  const [customEquip, setCustomEquip] = useState("Bodyweight");
  const [customDiff, setCustomDiff] = useState("Beginner");
  const [customDescription, setCustomDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Load saved plans on focus ────────────────────────────────────
  const fetchSavedPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const res = await api.get("/plans");
      setSavedPlans(res.data || []);
      setSelectedPlanId(res.data?.find((plan) => plan.isActive)?._id || null);
    } catch (err) {
      console.error("fetch plans:", err.message);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSavedPlans();
    }, [fetchSavedPlans]),
  );

  // ── Save current draft ───────────────────────────────────────────
  const handleSavePlan = async () => {
    const trimmed = planName.trim();
    if (!trimmed || draftExercises.length === 0) return;
    try {
      await savePlan(trimmed, editingPlanId);
      setPlanName("");
      setEditingPlanId(null);
      await fetchSavedPlans();
      Alert.alert(
        editingPlanId ? "Plan updated!" : "Saved!",
        `"${trimmed}" is now your active plan.`,
      );
    } catch (err) {
      Alert.alert("Save failed", err.message);
    }
  };

  // ── Create custom exercise ───────────────────────────────────────
  const handleAddCustom = async () => {
    if (!customName.trim()) return;
    try {
      setCreating(true);
      const res = await api.post("/exercises", {
        name: customName.trim(),
        muscleGroup: customGroup,
        equipment: customEquip.trim() || "Bodyweight",
        difficulty: customDiff,
        description: customDescription.trim(),
      });
      addCustomExercise(
        res.data.name,
        res.data.description || "",
        res.data.muscleGroup,
      );
      setCustomName("");
      setCustomGroup("Chest");
      setCustomEquip("Bodyweight");
      setCustomDiff("Beginner");
      setCustomDescription("");
      setCustomModalVisible(false);
    } catch (err) {
      Alert.alert(
        "Could not create",
        err.response?.data?.message || err.message,
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Saved plan actions ───────────────────────────────────────────
  const handleEditSavedPlan = () => {
    if (!activeSavedPlan) return;
    replaceDraft(
      activeSavedPlan.exercises.map((ex, idx) => ({
        exerciseId: ex.exerciseId || `custom-${idx}-${Date.now()}`,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        description: ex.description || "",
        sets: ex.sets,
        reps: ex.reps,
        isCustom: ex.isCustom,
      })),
    );
    setPlanName(activeSavedPlan.name);
    setEditingPlanId(activeSavedPlan._id);
    setActiveSavedPlan(null);
  };

  const handleSelectPlan = async (plan) => {
    try {
      await api.put(`/plans/${plan._id}/select`);
      setSelectedPlanId(plan._id);
      setActiveSavedPlan(plan);
    } catch (err) {
      Alert.alert(
        "Selection failed",
        err.response?.data?.message || err.message,
      );
    }
  };

  const handleRemoveSavedPlan = () => {
    if (!activeSavedPlan) return;
    Alert.alert(
      "Remove plan?",
      `Are you sure you want to remove "${activeSavedPlan.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/plans/${activeSavedPlan._id}`);
              setActiveSavedPlan(null);
              fetchSavedPlans();
            } catch (err) {
              Alert.alert("Delete failed", err.message);
            }
          },
        },
      ],
    );
  };

  const handleStartSavedPlan = () => {
    setActiveSavedPlan(null);
    navigation.navigate("WorkoutSession");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Workouts</Text>

        {/* ── Current Draft ─────────────────────────────────────── */}
        <View style={styles.section}>
          <TextInput
            value={planName}
            onChangeText={setPlanName}
            placeholder="Plan name, e.g. Leg Day"
            maxLength={30}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.planNameInput,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Plan
          </Text>

          {draftExercises.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              Your plan is empty. Add exercises from Browse below.
            </Text>
          ) : (
            draftExercises.map((exercise) => (
              <View
                key={exercise.exerciseId}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.planHeader}>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exercise.name}
                    </Text>
                    {exercise.muscleGroup ? (
                      <Text
                        style={[
                          styles.exerciseMuscle,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {exercise.muscleGroup}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeExercise(exercise.exerciseId)}
                  >
                    <Text
                      style={[styles.remove, { color: colors.textSecondary }]}
                    >
                      ×
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.steppers}>
                  <Stepper
                    label="Sets"
                    value={exercise.sets}
                    onChange={(value) =>
                      updateExercise(exercise.exerciseId, "sets", value)
                    }
                  />
                  <Stepper
                    label="Reps"
                    value={exercise.reps}
                    onChange={(value) =>
                      updateExercise(exercise.exerciseId, "reps", value)
                    }
                  />
                </View>
              </View>
            ))
          )}

          <Pressable
            onPress={() => navigation.navigate("BrowseExercises")}
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
          >
            <Text
              style={[styles.secondaryButtonText, { color: colors.primary }]}
            >
              Add from Browse
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setCustomModalVisible(true)}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Add Custom Exercise
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSavePlan}
            disabled={
              !planName.trim() || draftExercises.length === 0 || savingPlan
            }
            style={[
              styles.saveButton,
              {
                backgroundColor:
                  planName.trim() && draftExercises.length > 0
                    ? colors.primary
                    : colors.border,
                opacity: savingPlan ? 0.6 : 1,
              },
            ]}
          >
            {savingPlan ? (
              <ActivityIndicator color={accentTextColor} />
            ) : (
              <Text style={[styles.saveButtonText, { color: accentTextColor }]}>
                Save Plan
              </Text>
            )}
          </Pressable>
        </View>

        {/* ── Saved Plans ───────────────────────────────────────── */}
        <View style={[styles.savedSection, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Saved Plans
          </Text>

          {loadingPlans ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 20 }}
            />
          ) : savedPlans.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              No saved plans yet.
            </Text>
          ) : (
            savedPlans.map((savedPlan) => (
              <Pressable
                key={savedPlan._id}
                onPress={() => handleSelectPlan(savedPlan)}
                style={[
                  styles.savedPlan,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor:
                      selectedPlanId === savedPlan._id
                        ? colors.primary
                        : "transparent",
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.savedPlanName, { color: colors.text }]}>
                  {savedPlan.name}
                </Text>
                <Text
                  style={[
                    styles.exerciseMuscle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {savedPlan.exercises?.length || 0} exercise
                  {(savedPlan.exercises?.length || 0) === 1 ? "" : "s"}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Saved Plan Detail Modal ─────────────────────────────── */}
      <Modal
        visible={Boolean(activeSavedPlan)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveSavedPlan(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setActiveSavedPlan(null)}
          />
          {activeSavedPlan ? (
            <View
              style={[
                styles.savedModal,
                { backgroundColor: colors.background },
              ]}
            >
              <View style={styles.savedModalHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {activeSavedPlan.name}
                  </Text>
                  <Text
                    style={[styles.modalMeta, { color: colors.textSecondary }]}
                  >
                    {activeSavedPlan.exercises.length} exercise
                    {activeSavedPlan.exercises.length === 1 ? "" : "s"}
                  </Text>
                </View>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => setActiveSavedPlan(null)}
                >
                  <Text
                    style={[styles.remove, { color: colors.textSecondary }]}
                  >
                    ×
                  </Text>
                </Pressable>
              </View>

              <ScrollView style={styles.savedExerciseList}>
                {activeSavedPlan.exercises.map((exercise, idx) => (
                  <View
                    key={exercise._id || idx}
                    style={[
                      styles.savedExercise,
                      { backgroundColor: colors.cardBackground },
                    ]}
                  >
                    <View style={styles.savedExerciseContent}>
                      <View style={styles.exerciseInfo}>
                        <Text
                          style={[styles.exerciseName, { color: colors.text }]}
                        >
                          {exercise.name}
                        </Text>
                        {exercise.muscleGroup ? (
                          <Text
                            style={[
                              styles.exerciseMuscle,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {exercise.muscleGroup}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.savedExerciseMeta,
                        { color: colors.primary },
                      ]}
                    >
                      {exercise.sets} sets · {exercise.reps} reps
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.savedModalActions}>
                <View style={styles.savedModalActionRow}>
                  <Pressable
                    onPress={handleEditSavedPlan}
                    style={[
                      styles.addButton,
                      styles.savedModalActionButton,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[styles.addButtonText, { color: accentTextColor }]}
                    >
                      Load to Edit
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleRemoveSavedPlan}
                    style={[
                      styles.removePlanButton,
                      styles.savedModalActionButton,
                      { borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Remove Plan
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={handleStartSavedPlan}
                  style={[
                    styles.startButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[styles.addButtonText, { color: accentTextColor }]}
                  >
                    Start Workout
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

      {/* ── Custom Exercise Modal ───────────────────────────────── */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.customCard, { backgroundColor: colors.background }]}
          >
            <ScrollView>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Custom Exercise
              </Text>

              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                NAME
              </Text>
              <TextInput
                value={customName}
                onChangeText={setCustomName}
                placeholder="Exercise name"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.customInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
                autoFocus
              />

              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary, marginTop: 12 },
                ]}
              >
                MUSCLE GROUP
              </Text>
              <View style={styles.chipRowInline}>
                {MUSCLE_GROUPS.map((g) => {
                  const active = customGroup === g;
                  return (
                    <Pressable
                      key={g}
                      onPress={() => setCustomGroup(g)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.cardBackground,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: active ? "#FFF" : colors.text,
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {g}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary, marginTop: 12 },
                ]}
              >
                EQUIPMENT
              </Text>
              <TextInput
                value={customEquip}
                onChangeText={setCustomEquip}
                placeholder="e.g. Dumbbell"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.customInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />

              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary, marginTop: 12 },
                ]}
              >
                DIFFICULTY
              </Text>
              <View style={styles.chipRowInline}>
                {DIFFICULTIES.map((d) => {
                  const active = customDiff === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setCustomDiff(d)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.cardBackground,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: active ? "#FFF" : colors.text,
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary, marginTop: 12 },
                ]}
              >
                DESCRIPTION (OPTIONAL)
              </Text>
              <TextInput
                value={customDescription}
                onChangeText={setCustomDescription}
                placeholder="How to perform it..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                style={[
                  styles.customDescriptionInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setCustomModalVisible(false)}>
                <Text
                  style={[styles.actionText, { color: colors.textSecondary }]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAddCustom}
                disabled={!customName.trim() || creating}
              >
                <Text
                  style={[
                    styles.actionText,
                    {
                      color: customName.trim() ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {creating ? "Adding..." : "Add"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 20 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "800" },
  planNameInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    padding: 13,
  },
  empty: { fontSize: 14, marginVertical: 8 },
  planCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  planHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exerciseInfo: { flex: 1, minWidth: 0 },
  exerciseName: { fontSize: 15, fontWeight: "700" },
  exerciseMuscle: { fontSize: 12, marginTop: 4 },
  removeButton: { alignSelf: "flex-start", marginLeft: 8 },
  remove: { fontSize: 24 },
  steppers: { flexDirection: "row", gap: 15, justifyContent: "center" },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    padding: 13,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "700" },
  saveButton: { alignItems: "center", borderRadius: 10, padding: 14 },
  saveButtonText: { fontSize: 15, fontWeight: "800" },
  savedSection: { gap: 10 },
  savedPlan: { borderRadius: 10, padding: 14 },
  savedPlanName: { fontSize: 16, fontWeight: "800" },
  savedModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "82%",
    padding: 20,
  },
  savedModalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginBottom: 16,
  },
  savedExerciseList: { maxHeight: 300 },
  savedExercise: { borderRadius: 10, padding: 12, marginBottom: 8 },
  savedExerciseContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  savedExerciseMeta: { fontSize: 12, fontWeight: "700", marginTop: 6 },
  savedModalActions: { gap: 10, marginTop: 20 },
  savedModalActionRow: { flexDirection: "row", gap: 10 },
  savedModalActionButton: { flex: 1 },
  startButton: { alignItems: "center", borderRadius: 10, padding: 14 },
  removePlanButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    padding: 13,
  },
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.55)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalTitle: { fontSize: 21, fontWeight: "800", marginBottom: 6 },
  modalMeta: { fontSize: 13, marginBottom: 14 },
  addButton: { alignItems: "center", borderRadius: 10, padding: 14 },
  addButtonText: { fontSize: 15, fontWeight: "800" },
  customCard: { borderRadius: 16, margin: 24, padding: 20, maxHeight: "80%" },
  customInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    padding: 12,
  },
  customDescriptionInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    marginTop: 8,
    minHeight: 70,
    padding: 12,
    textAlignVertical: "top",
  },
  chipRowInline: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    marginTop: 20,
  },
  actionText: { fontSize: 15, fontWeight: "700" },
});
