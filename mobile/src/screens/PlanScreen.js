import React, { useState, useCallback, useEffect } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  NestableScrollContainer,
  NestableDraggableFlatList,
} from "react-native-draggable-flatlist";
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
    draftName,
    setDraftName,
    editingPlanId,
    setEditingPlanId,
    removeExercise,
    updateExercise,
    addExercise,
    replaceDraft,
    reorderExercises,
    loadPlanForEdit,
    savePlan,
    savingPlan,
    unapprovedExercises,
    hasUnapprovedExercises,
    refreshDraftStatuses,
    refreshingStatuses,
    rejectedNotices,
    clearRejectedNotices,
  } = usePlanDraft();

  const [savedPlans, setSavedPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activeSavedPlan, setActiveSavedPlan] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customGroup, setCustomGroup] = useState("Chest");
  const [customEquip, setCustomEquip] = useState("Bodyweight");
  const [customDiff, setCustomDiff] = useState("Beginner");
  const [customDescription, setCustomDescription] = useState("");
  const [creating, setCreating] = useState(false);

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

  // Rejected-notice alert
  useEffect(() => {
    if (rejectedNotices.length > 0) {
      const lines = rejectedNotices
        .map((r) => `• ${r.name}${r.reason ? ` — ${r.reason}` : ""}`)
        .join("\n");
      Alert.alert(
        "Exercise rejected",
        `The following exercise(s) were rejected and removed from your plan:\n\n${lines}`,
        [{ text: "OK", onPress: clearRejectedNotices }],
      );
    }
  }, [rejectedNotices, clearRejectedNotices]);

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchSavedPlans(), refreshDraftStatuses()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchSavedPlans, refreshDraftStatuses]);

  const isEditing = Boolean(editingPlanId);
  const hasDraftWork = draftExercises.length > 0 || draftName.trim().length > 0;

  const handleSavePlan = async () => {
    const trimmed = draftName.trim();
    if (!trimmed || draftExercises.length === 0) return;

    if (hasUnapprovedExercises) {
      const names = unapprovedExercises.map((e) => e.name).join(", ");
      Alert.alert(
        "Pending approval",
        `Cannot save while these exercises are awaiting approval: ${names}.`,
      );
      return;
    }

    try {
      await savePlan(trimmed, editingPlanId);
      await fetchSavedPlans();
      Alert.alert(
        isEditing ? "Plan updated!" : "Saved!",
        `"${trimmed}" is now your active plan.`,
      );
    } catch (err) {
      Alert.alert("Save failed", err.message);
    }
  };

  const handleClearDraft = () => {
    replaceDraft([]);
    setDraftName("");
    setEditingPlanId(null);
  };

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
      addExercise(res.data);
      setCustomName("");
      setCustomGroup("Chest");
      setCustomEquip("Bodyweight");
      setCustomDiff("Beginner");
      setCustomDescription("");
      setCustomModalVisible(false);
      Alert.alert(
        "Submitted for review",
        "Your custom exercise is pending admin approval and can't be saved to a plan until approved.",
      );
    } catch (err) {
      Alert.alert(
        "Could not create",
        err.response?.data?.message || err.message,
      );
    } finally {
      setCreating(false);
    }
  };

  const doLoadToEdit = () => {
    loadPlanForEdit(activeSavedPlan);
    setActiveSavedPlan(null);
  };

  const handleEditSavedPlan = () => {
    if (!activeSavedPlan) return;
    if (hasDraftWork) {
      Alert.alert(
        "Replace current draft?",
        "You have unsaved exercises in your current draft. Loading this plan will replace them.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Replace", style: "destructive", onPress: doLoadToEdit },
        ],
      );
    } else {
      doLoadToEdit();
    }
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
              if (editingPlanId === activeSavedPlan._id) {
                handleClearDraft();
              }
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

  const renderDraftRow = ({ item: exercise, drag, isActive }) => {
    const isPending = exercise.status === "pending";
    const isRejected = exercise.status === "rejected";
    return (
      <View
        style={[
          styles.planCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: isActive ? colors.primary : colors.border,
            opacity: isActive ? 0.85 : 1,
          },
        ]}
      >
        <Pressable
          onLongPress={drag}
          delayLongPress={150}
          hitSlop={10}
          style={styles.dragHandle}
        >
          <Text
            style={[styles.dragHandleText, { color: colors.textSecondary }]}
          >
            ☰
          </Text>
        </Pressable>

        <View style={styles.planContent}>
          <View style={styles.planHeader}>
            <View style={styles.exerciseInfo}>
              <Text style={[styles.exerciseName, { color: colors.text }]}>
                {exercise.name}
              </Text>
              <View style={styles.metaRow}>
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
                {isPending && (
                  <Text style={styles.pendingPill}>⏳ PENDING</Text>
                )}
                {isRejected && (
                  <Text style={styles.rejectedPill}>🚫 REJECTED</Text>
                )}
              </View>
            </View>
            <Pressable
              style={styles.removeButton}
              onPress={() => removeExercise(exercise.exerciseId)}
            >
              <Text style={[styles.remove, { color: colors.textSecondary }]}>
                ✕
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
      </View>
    );
  };

  const saveLabel = (() => {
    if (savingPlan) return null;
    if (!draftName.trim() && draftExercises.length === 0) return "Save Plan";
    if (!draftName.trim()) return "Save Plan (add a name)";
    if (draftExercises.length === 0) return "Save Plan (add exercises)";
    if (hasUnapprovedExercises) return "Save Plan (awaiting approval)";
    return isEditing ? "Update Plan" : "Save Plan";
  })();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <NestableScrollContainer
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>Workouts</Text>

        {isEditing && (
          <View
            style={[
              styles.editingBanner,
              { backgroundColor: colors.accentMuted },
            ]}
          >
            <Text style={[styles.editingBannerText, { color: colors.primary }]}>
              Editing: {draftName || "Untitled"}
            </Text>
            <Pressable onPress={handleClearDraft} hitSlop={8}>
              <Text
                style={[styles.editingBannerAction, { color: colors.primary }]}
              >
                Start new
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            PLAN NAME
          </Text>
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            placeholder="e.g. Leg Day"
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

          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleLeft}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                My Plan
              </Text>
              <View
                style={[
                  styles.countPill,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <Text
                  style={[
                    styles.countPillText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {draftExercises.length}
                </Text>
              </View>
            </View>
            {hasUnapprovedExercises ? (
              <Pressable
                onPress={refreshDraftStatuses}
                disabled={refreshingStatuses}
                hitSlop={8}
                style={styles.refreshBtn}
              >
                {refreshingStatuses ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={[styles.refreshBtnText, { color: colors.primary }]}
                  >
                    ↻ Check approval
                  </Text>
                )}
              </Pressable>
            ) : draftExercises.length > 1 ? (
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                Long-press ☰ to reorder
              </Text>
            ) : null}
          </View>

          {draftExercises.length === 0 ? (
            <View
              style={[
                styles.emptyDraft,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.emptyDraftText, { color: colors.textSecondary }]}
              >
                No exercises yet.
              </Text>
              <Text
                style={[styles.emptyDraftHint, { color: colors.textSecondary }]}
              >
                Add from Browse or create a custom exercise below.
              </Text>
            </View>
          ) : (
            <NestableDraggableFlatList
              data={draftExercises}
              keyExtractor={(item) => item.exerciseId}
              onDragEnd={({ from, to }) => reorderExercises(from, to)}
              renderItem={renderDraftRow}
              scrollEnabled={false}
              activationDistance={20}
              containerStyle={styles.dragList}
            />
          )}

          {hasUnapprovedExercises && (
            <View
              style={[styles.warningBanner, { borderColor: colors.border }]}
            >
              <Text style={styles.warningTitle}>⏳ Pending approval</Text>
              <Text
                style={[styles.warningText, { color: colors.textSecondary }]}
              >
                These exercises can't be saved to a plan until an admin
                approves them:
              </Text>
              {unapprovedExercises.map((e) => (
                <Text
                  key={e.exerciseId}
                  style={[styles.warningItem, { color: colors.text }]}
                >
                  • {e.name}{" "}
                  <Text style={{ color: colors.textSecondary }}>
                    ({e.status})
                  </Text>
                </Text>
              ))}
            </View>
          )}

          <Pressable
            onPress={() => navigation.navigate("BrowseExercises")}
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
          >
            <Text
              style={[styles.secondaryButtonText, { color: colors.primary }]}
            >
              + Add from Browse
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setCustomModalVisible(true)}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              + Add Custom Exercise
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSavePlan}
            disabled={
              !draftName.trim() ||
              draftExercises.length === 0 ||
              savingPlan ||
              hasUnapprovedExercises
            }
            style={[
              styles.saveButton,
              {
                backgroundColor:
                  draftName.trim() &&
                  draftExercises.length > 0 &&
                  !hasUnapprovedExercises
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
                {saveLabel}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.savedSection, { marginTop: 28 }]}>
          <View style={styles.savedHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Saved Plans
            </Text>
            <Pressable
              onPress={() => navigation.navigate("WorkoutHistory")}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.historyLink, { color: colors.primary }]}>
                History →
              </Text>
            </Pressable>
          </View>

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
            savedPlans.map((savedPlan) => {
              const isActive = savedPlan.isActive;
              const isEditingThis = editingPlanId === savedPlan._id;
              return (
                <Pressable
                  key={savedPlan._id}
                  onPress={() => handleSelectPlan(savedPlan)}
                  style={({ pressed }) => [
                    styles.savedPlan,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: isEditingThis
                        ? colors.primary
                        : "transparent",
                      borderWidth: 1,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View style={styles.savedPlanRow}>
                    <View style={styles.savedPlanLeft}>
                      <Text
                        style={[styles.savedPlanName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {savedPlan.name}
                      </Text>
                      <Text
                        style={[
                          styles.exerciseMuscle,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {savedPlan.exercises?.length || 0}{" "}
                        {(savedPlan.exercises?.length || 0) === 1
                          ? "exercise"
                          : "exercises"}
                      </Text>
                    </View>
                    <View style={styles.savedPlanRight}>
                      {isActive && (
                        <View
                          style={[
                            styles.activePill,
                            { backgroundColor: colors.accentMuted },
                          ]}
                        >
                          <Text
                            style={[
                              styles.activePillText,
                              { color: colors.primary },
                            ]}
                          >
                            ACTIVE
                          </Text>
                        </View>
                      )}
                      <Text
                        style={[
                          styles.chevron,
                          { color: colors.textSecondary },
                        ]}
                      >
                        ›
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </NestableScrollContainer>

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
                    {activeSavedPlan.exercises.length}{" "}
                    {activeSavedPlan.exercises.length === 1
                      ? "exercise"
                      : "exercises"}
                  </Text>
                </View>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => setActiveSavedPlan(null)}
                >
                  <Text
                    style={[styles.remove, { color: colors.textSecondary }]}
                  >
                    ✕
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
                      {exercise.sets} sets × {exercise.reps} reps
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

  editingBanner: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editingBannerText: { fontSize: 13, fontWeight: "800" },
  editingBannerAction: { fontSize: 13, fontWeight: "800" },

  section: { gap: 12 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sectionTitleLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800" },
  countPill: {
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countPillText: { fontSize: 12, fontWeight: "800" },
  hintText: { fontSize: 12 },
  refreshBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  refreshBtnText: { fontSize: 13, fontWeight: "700" },

  planNameInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    padding: 13,
  },
  empty: { fontSize: 14, marginVertical: 8 },
  emptyDraft: {
    alignItems: "center",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyDraftText: { fontSize: 14, fontWeight: "700" },
  emptyDraftHint: { fontSize: 12, marginTop: 4, textAlign: "center" },

  warningBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(251,140,0,0.08)",
    gap: 4,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FB8C00",
    marginBottom: 2,
  },
  warningText: { fontSize: 12, lineHeight: 16, marginBottom: 4 },
  warningItem: { fontSize: 13, fontWeight: "600" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 6,
  },
  pendingPill: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FB8C00",
    backgroundColor: "rgba(251,140,0,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    letterSpacing: 0.5,
    overflow: "hidden",
  },
  rejectedPill: {
    fontSize: 9,
    fontWeight: "800",
    color: "#E53935",
    backgroundColor: "rgba(229,57,53,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    letterSpacing: 0.5,
    overflow: "hidden",
  },

  dragList: { marginBottom: -10 },
  planCard: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 10,
    padding: 14,
  },
  planContent: { flex: 1, gap: 14, minWidth: 0 },
  planHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  dragHandle: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    paddingRight: 12,
  },
  dragHandleText: { fontSize: 18, fontWeight: "800" },
  exerciseInfo: { flex: 1, minWidth: 0 },
  exerciseName: { fontSize: 15, fontWeight: "700" },
  exerciseMuscle: { fontSize: 12, marginTop: 4 },
  removeButton: { alignSelf: "flex-start", marginLeft: 8 },
  remove: { fontSize: 18, fontWeight: "800" },
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
  savedHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  historyLink: { fontSize: 14, fontWeight: "700" },
  savedPlan: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  savedPlanRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  savedPlanLeft: { flex: 1, minWidth: 0 },
  savedPlanName: { fontSize: 16, fontWeight: "800" },
  savedPlanRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  activePill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activePillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  chevron: { fontSize: 22, fontWeight: "400" },

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
  savedExercise: { borderRadius: 10, marginBottom: 8, padding: 12 },
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
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    marginTop: 20,
  },
  actionText: { fontSize: 15, fontWeight: "700" },
});