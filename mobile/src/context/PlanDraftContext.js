import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import api from "../api/api";

const PlanDraftContext = createContext(null);

// Collision-safe id for a custom exercise. Date.now() alone can collide
// if two customs are added within the same millisecond.
const makeCustomId = () =>
  `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function PlanDraftProvider({ children }) {
  const [draftExercises, setDraftExercises] = useState([]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const addExercise = useCallback((exercise) => {
    setDraftExercises((prev) => {
      if (prev.some((e) => e.exerciseId === exercise._id)) return prev;
      return [
        ...prev,
        {
          exerciseId: exercise._id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          description: exercise.description || "",
          sets: 3,
          reps: 10,
          isCustom: false,
        },
      ];
    });
  }, []);

  const addCustomExercise = useCallback(
    (name, description = "", muscleGroup = null) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setDraftExercises((prev) => [
        ...prev,
        {
          exerciseId: makeCustomId(),
          name: trimmed,
          description: description.trim(),
          muscleGroup,
          sets: 3,
          reps: 10,
          isCustom: true,
        },
      ]);
    },
    [],
  );

  const removeExercise = useCallback((exerciseId) => {
    setDraftExercises((prev) =>
      prev.filter((e) => e.exerciseId !== exerciseId),
    );
  }, []);

  const updateExercise = useCallback((exerciseId, field, value) => {
    setDraftExercises((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId ? { ...e, [field]: Math.max(1, value) } : e,
      ),
    );
  }, []);

  // Swap items for drag-to-reorder.
  const reorderExercises = useCallback((from, to) => {
    setDraftExercises((prev) => {
      if (from === to) return prev;
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const isInDraft = useCallback(
    (catalogId) => draftExercises.some((e) => e.exerciseId === catalogId),
    [draftExercises],
  );

  const clearDraft = useCallback(() => {
    setDraftExercises([]);
    setSaveError(null);
  }, []);

  const replaceDraft = useCallback(
    (exercises) =>
      setDraftExercises(exercises.map((exercise) => ({ ...exercise }))),
    [],
  );

  const savePlan = useCallback(
    async (planName = "My Plan", planId = null) => {
      if (draftExercises.length === 0) {
        throw new Error("Add at least one exercise before saving.");
      }
      try {
        setSavingPlan(true);
        setSaveError(null);

        const payload = {
          name: planName,
          exercises: draftExercises.map((e) => ({
            exerciseId: e.isCustom ? null : e.exerciseId,
            name: e.name,
            muscleGroup: e.muscleGroup,
            description: e.description || "",
            // Force integer bounds to match backend validator.
            sets: Math.max(1, Math.min(50, Math.floor(Number(e.sets)) || 3)),
            reps: Math.max(1, Math.min(200, Math.floor(Number(e.reps)) || 10)),
            isCustom: Boolean(e.isCustom),
          })),
        };

        const res = planId
          ? await api.put(`/plans/${planId}`, payload)
          : await api.post("/plans", payload);
        clearDraft();
        return res.data;
      } catch (err) {
        const data = err.response?.data;
        let msg;
        if (data?.errors && Array.isArray(data.errors)) {
          // Show the field-level errors from express-validator.
          msg =
            `${data.message || "Validation failed"}:\n\n` +
            data.errors.map((e) => `• ${e.field}: ${e.message}`).join("\n");
        } else {
          msg = data?.message || err.message || "Could not save plan";
        }
        setSaveError(msg);
        throw new Error(msg);
      } finally {
        setSavingPlan(false);
      }
    },
    [draftExercises, clearDraft],
  );

  return (
    <PlanDraftContext.Provider
      value={{
        draftExercises,
        addExercise,
        addCustomExercise,
        removeExercise,
        updateExercise,
        reorderExercises,
        isInDraft,
        clearDraft,
        replaceDraft,
        savePlan,
        savingPlan,
        saveError,
      }}
    >
      {children}
    </PlanDraftContext.Provider>
  );
}

export function usePlanDraft() {
  const ctx = useContext(PlanDraftContext);
  if (!ctx)
    throw new Error("usePlanDraft must be used within PlanDraftProvider");
  return ctx;
}