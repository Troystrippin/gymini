import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/theme";
import { usePlanDraft } from "../context/PlanDraftContext";
import Stepper from "../components/Stepper";

const EXERCISES = [
  {
    id: "1",
    name: "Barbell Bench Press",
    muscle: "Chest",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description:
      "Lower the bar to mid-chest, then press it back up under control.",
  },
  {
    id: "2",
    name: "Pull-Up",
    muscle: "Back",
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    description:
      "Pull your chin above the bar while keeping your body controlled.",
  },
  {
    id: "3",
    name: "Barbell Squat",
    muscle: "Legs",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description:
      "Squat with a neutral spine, then drive through your feet to stand.",
  },
  {
    id: "4",
    name: "Dumbbell Shoulder Press",
    muscle: "Shoulders",
    equipment: "Dumbbell",
    difficulty: "Beginner",
    description:
      "Press the dumbbells overhead from shoulder height and lower slowly.",
  },
  {
    id: "5",
    name: "Plank",
    muscle: "Core",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    description: "Hold a straight line from your shoulders to your heels.",
  },
];

const CATEGORIES = ["All", "Chest", "Back", "Legs", "Shoulders", "Core"];

export default function PlanScreen() {
  const { colors } = useTheme();
  const [view, setView] = useState("Plan");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const {
    draftExercises,
    addExercise,
    addCustomExercise,
    removeExercise,
    updateExercise,
    isInDraft,
    clearDraft,
    replaceDraft,
  } = usePlanDraft();
  const [activeExercise, setActiveExercise] = useState(null);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [planName, setPlanName] = useState("");
  const [savedPlans, setSavedPlans] = useState([]);
  const [activeSavedPlan, setActiveSavedPlan] = useState(null);

  const filteredExercises = EXERCISES.filter((exercise) => {
    const matchesSearch = exercise.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = category === "All" || exercise.muscle === category;
    return matchesSearch && matchesCategory;
  });

  const toggleExercise = (exercise) => {
    if (!isInDraft(exercise.id))
      addExercise({
        _id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscle,
      });
    setActiveExercise(null);
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    addCustomExercise(customName, customDescription);
    setCustomName("");
    setCustomDescription("");
    setCustomModalVisible(false);
    setView("Plan");
  };

  const handleSavePlan = () => {
    const trimmedName = planName.trim();
    if (!trimmedName || draftExercises.length === 0) return;

    setSavedPlans((currentPlans) => [
      ...currentPlans,
      {
        id: `${Date.now()}`,
        name: trimmedName,
        exercises: draftExercises,
      },
    ]);
    setPlanName("");
    clearDraft();
  };

  const handleEditSavedPlan = () => {
    if (!activeSavedPlan) return;
    replaceDraft(activeSavedPlan.exercises);
    setPlanName(activeSavedPlan.name);
    setSavedPlans((currentPlans) =>
      currentPlans.filter((plan) => plan.id !== activeSavedPlan.id),
    );
    setActiveSavedPlan(null);
    setView("Plan");
  };

  const handleRemoveSavedPlan = () => {
    if (!activeSavedPlan) return;
    Alert.alert(
      "Remove plan?",
      `Are you sure you want to remove \"${activeSavedPlan.name}\"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setSavedPlans((currentPlans) =>
              currentPlans.filter((plan) => plan.id !== activeSavedPlan.id),
            );
            setActiveSavedPlan(null);
          },
        },
      ],
    );
  };

  const handleRemoveSavedExercise = (exerciseId) => {
    if (!activeSavedPlan) return;

    const updatedPlan = {
      ...activeSavedPlan,
      exercises: activeSavedPlan.exercises.filter(
        (exercise) => exercise.exerciseId !== exerciseId,
      ),
    };

    setSavedPlans((currentPlans) =>
      currentPlans.map((plan) =>
        plan.id === updatedPlan.id ? updatedPlan : plan,
      ),
    );
    setActiveSavedPlan(updatedPlan);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Workouts</Text>
        <View
          style={[styles.switcher, { backgroundColor: colors.cardBackground }]}
        >
          {["Plan", "Browse"].map((option) => {
            const selected = view === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setView(option)}
                style={[
                  styles.switchOption,
                  selected && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.switchText,
                    { color: selected ? "#FFFFFF" : colors.textSecondary },
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {view === "Plan" ? (
          <View style={styles.section}>
            <TextInput
              value={planName}
              onChangeText={setPlanName}
              placeholder="Plan name, e.g. Leg Day"
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
                Your plan is empty. Open Browse to add exercises.
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
                      {exercise.description ? (
                        <Text
                          style={[
                            styles.exerciseDescription,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {exercise.description}
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
              onPress={() => setView("Browse")}
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
              <Text
                style={[styles.secondaryButtonText, { color: colors.text }]}
              >
                Add Custom Exercise
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSavePlan}
              disabled={!planName.trim() || draftExercises.length === 0}
              style={[
                styles.saveButton,
                {
                  backgroundColor:
                    planName.trim() && draftExercises.length > 0
                      ? colors.primary
                      : colors.border,
                },
              ]}
            >
              <Text style={styles.saveButtonText}>Save Plan</Text>
            </Pressable>

            {savedPlans.length > 0 && (
              <View style={styles.savedSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Saved Plans
                </Text>
                {savedPlans.map((savedPlan) => (
                  <Pressable
                    key={savedPlan.id}
                    onPress={() => setActiveSavedPlan(savedPlan)}
                    style={[
                      styles.savedPlan,
                      { backgroundColor: colors.cardBackground },
                    ]}
                  >
                    <Text
                      style={[styles.savedPlanName, { color: colors.text }]}
                    >
                      {savedPlan.name}
                    </Text>
                    <Text
                      style={[
                        styles.exerciseMuscle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {savedPlan.exercises.length} exercise
                      {savedPlan.exercises.length === 1 ? "" : "s"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.search,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {CATEGORIES.map((option) => {
                const selected = category === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setCategory(option)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.cardBackground,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? "#FFFFFF" : colors.textSecondary,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {filteredExercises.map((exercise) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                selected={isInDraft(exercise.id)}
                onPress={() => setActiveExercise(exercise)}
                colors={colors}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(activeExercise)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setActiveExercise(null)}
          />
          {activeExercise ? (
            <View
              style={[styles.modalCard, { backgroundColor: colors.background }]}
            >
              <View
                style={[
                  styles.media,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <Text
                  style={[styles.mediaText, { color: colors.textSecondary }]}
                >
                  {activeExercise.muscle}
                </Text>
              </View>
              <View style={styles.modalBody}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {activeExercise.name}
                </Text>
                <Text
                  style={[styles.modalMeta, { color: colors.textSecondary }]}
                >
                  {activeExercise.muscle} · {activeExercise.equipment} ·{" "}
                  {activeExercise.difficulty}
                </Text>
                <Text style={[styles.description, { color: colors.text }]}>
                  {activeExercise.description}
                </Text>
                <Pressable
                  onPress={() => toggleExercise(activeExercise)}
                  disabled={isInDraft(activeExercise.id)}
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: isInDraft(activeExercise.id)
                        ? colors.cardBackground
                        : colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.addButtonText,
                      {
                        color: isInDraft(activeExercise.id)
                          ? colors.textSecondary
                          : "#FFFFFF",
                      },
                    ]}
                  >
                    {isInDraft(activeExercise.id)
                      ? "Already Added"
                      : "Add to Plan"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

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

              <View style={styles.savedExerciseList}>
                {activeSavedPlan.exercises.map((exercise) => (
                  <View
                    key={exercise.exerciseId}
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
                      <Pressable
                        style={styles.removeButton}
                        onPress={() =>
                          handleRemoveSavedExercise(exercise.exerciseId)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${exercise.name}`}
                      >
                        <Text
                          style={[
                            styles.remove,
                            { color: colors.textSecondary },
                          ]}
                        >
                          ×
                        </Text>
                      </Pressable>
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
              </View>

              <View style={styles.savedModalActions}>
                <Pressable
                  onPress={handleEditSavedPlan}
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.addButtonText}>Edit Plan</Text>
                </Pressable>
                <Pressable
                  onPress={handleRemoveSavedPlan}
                  style={[
                    styles.removePlanButton,
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Custom Exercise
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
            <TextInput
              value={customDescription}
              onChangeText={setCustomDescription}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              style={[
                styles.customDescriptionInput,
                { color: colors.text, borderColor: colors.border },
              ]}
            />
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
                disabled={!customName.trim()}
              >
                <Text
                  style={[
                    styles.actionText,
                    {
                      color: customName.trim() ? colors.primary : colors.border,
                    },
                  ]}
                >
                  Add
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ExerciseRow({ exercise, selected, onPress, colors }) {
  const muscle = exercise.muscle ?? exercise.muscleGroup;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={[
        styles.exercise,
        {
          backgroundColor: selected
            ? colors.selectedcard
            : colors.cardBackground,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={styles.exerciseInfo}>
        <Text style={[styles.exerciseName, { color: colors.text }]}>
          {exercise.name}
        </Text>
        <Text style={[styles.exerciseMuscle, { color: colors.textSecondary }]}>
          {muscle}
        </Text>
      </View>
      <Text style={[styles.check, { color: colors.primary }]}>
        {selected ? "✓" : "+"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 20 },
  switcher: {
    borderRadius: 12,
    flexDirection: "row",
    marginBottom: 24,
    padding: 4,
  },
  switchOption: {
    alignItems: "center",
    borderRadius: 9,
    flex: 1,
    paddingVertical: 11,
  },
  switchText: { fontSize: 15, fontWeight: "700" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "800" },
  planNameInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    padding: 13,
  },
  search: { borderRadius: 10, borderWidth: 1, fontSize: 15, padding: 13 },
  categoryList: { gap: 8, paddingBottom: 2 },
  categoryChip: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  customDescriptionInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    marginTop: 10,
    minHeight: 80,
    padding: 12,
    textAlignVertical: "top",
  },
  exercise: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    padding: 14,
    elevation: 4,
  },
  exerciseInfo: { flex: 1, minWidth: 0 },
  exerciseName: { fontSize: 15, fontWeight: "700" },
  exerciseMuscle: { fontSize: 12, marginTop: 4 },
  exerciseDescription: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  check: { fontSize: 24, fontWeight: "700", marginLeft: 12 },
  planCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 14,
    elevation: 4,
  },
  planHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  removeButton: { alignSelf: "flex-start", marginLeft: 8, paddingTop: 0 },
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
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  savedSection: { gap: 10, marginTop: 12 },
  savedPlan: { borderRadius: 10, padding: 14, elevation: 4 },
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
  savedExerciseList: { gap: 10 },
  savedExercise: {
    borderRadius: 10,
    padding: 12,
  },
  savedExerciseContent: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  savedExerciseMeta: { fontSize: 12, fontWeight: "700" },
  savedModalActions: { gap: 10, marginTop: 20 },
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
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  media: { alignItems: "center", height: 150, justifyContent: "center" },
  mediaText: { fontSize: 18, fontWeight: "700" },
  modalBody: { padding: 20 },
  modalTitle: { fontSize: 21, fontWeight: "800", marginBottom: 6 },
  modalMeta: { fontSize: 13, marginBottom: 14 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  addButton: { alignItems: "center", borderRadius: 10, padding: 14 },
  addButtonText: { fontSize: 15, fontWeight: "800", color: "white" },
  customCard: { borderRadius: 16, margin: 24, padding: 20 },
  customInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    marginTop: 12,
    padding: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    marginTop: 20,
  },
  actionText: { fontSize: 15, fontWeight: "700" },
});
