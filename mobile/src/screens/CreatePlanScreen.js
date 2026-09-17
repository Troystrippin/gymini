import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { usePlanDraft } from "../../context/PlanDraftContext";
import Stepper from "../../components/Stepper";

export default function CreatePlanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    draftExercises,
    removeExercise,
    updateExercise,
    addCustomExercise,
    clearDraft,
  } = usePlanDraft();
  const [planName, setPlanName] = useState("");
  const [saving, setSaving] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customName, setCustomName] = useState("");

  const canSave = planName.trim().length > 0 && draftExercises.length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      // TODO: POST /api/workoutplans with { name: planName, exercises: draftExercises }
      // once backend integration resumes
      clearDraft();
      router.back();
    } catch (err) {
      console.error("Failed to save plan", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    addCustomExercise(customName);
    setCustomName("");
    setCustomModalVisible(false);
  };

  const renderExercise = ({ item }) => (
    <View
      style={[
        styles.exerciseCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.exerciseInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>
            {item.name}
          </Text>
          {item.isCustom && (
            <View style={[styles.customTag, { borderColor: colors.border }]}>
              <Text
                style={[styles.customTagText, { color: colors.textSecondary }]}
              >
                Custom
              </Text>
            </View>
          )}
        </View>
        {item.muscleGroup && (
          <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
            {item.muscleGroup}
          </Text>
        )}
      </View>
      <View style={styles.steppers}>
        <Stepper
          label="Sets"
          value={item.sets}
          onChange={(v) => updateExercise(item.exerciseId, "sets", v)}
        />
        <Stepper
          label="Reps"
          value={item.reps}
          onChange={(v) => updateExercise(item.exerciseId, "reps", v)}
        />
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => removeExercise(item.exerciseId)}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 18 }}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            New Plan
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={!canSave || saving}>
            <Text
              style={[
                styles.headerBtn,
                { color: canSave ? colors.accent : colors.textSecondary },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={planName}
          onChangeText={setPlanName}
          placeholder="Plan name (e.g. Push Day)"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.nameInput,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        />

        <View style={styles.listHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            EXERCISES ({draftExercises.length})
          </Text>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={[styles.addBtn, { borderColor: colors.border }]}
              onPress={() => setCustomModalVisible(true)}
            >
              <Text style={[styles.addBtnText, { color: colors.text }]}>
                + Custom
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { borderColor: colors.accent }]}
              onPress={() => router.push("/workout/browse-exercises")}
            >
              <Text style={[styles.addBtnText, { color: colors.accent }]}>
                + Add Exercise
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={draftExercises}
          keyExtractor={(item) => item.exerciseId}
          renderItem={renderExercise}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No exercises yet. Browse the catalog or add your own.
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>

      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setCustomModalVisible(false)}
          />
          <View
            style={[
              styles.customModalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Custom Exercise
            </Text>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="Exercise name"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              style={[
                styles.customInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            />
            <Text style={[styles.customHint, { color: colors.textSecondary }]}>
              Sets and reps default to 3 × 10 — adjust them after adding.
            </Text>
            <View style={styles.customModalBtns}>
              <TouchableOpacity
                style={[styles.customCancelBtn, { borderColor: colors.border }]}
                onPress={() => setCustomModalVisible(false)}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.customConfirmBtn,
                  {
                    backgroundColor: customName.trim()
                      ? colors.accent
                      : colors.border,
                  },
                ]}
                onPress={handleAddCustom}
                disabled={!customName.trim()}
              >
                <Text
                  style={{
                    color: "#000",
                    fontWeight: "600",
                  }}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBtn: { fontSize: 15 },
  headerTitle: { fontSize: 17 },
  nameInput: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  headerBtns: { flexDirection: "row", gap: 8 },
  addBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addBtnText: { fontSize: 13 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  exerciseName: { fontSize: 15 },
  customTag: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  customTagText: { fontSize: 10 },
  exerciseMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  steppers: { flexDirection: "row", gap: 16, marginRight: 8 },
  removeBtn: { padding: 4 },
  emptyState: { paddingTop: 60, alignItems: "center", paddingHorizontal: 30 },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 24,
  },
  customModalCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    marginBottom: 14,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  customHint: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 18,
  },
  customModalBtns: { flexDirection: "row", gap: 10 },
  customCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  customConfirmBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
});
