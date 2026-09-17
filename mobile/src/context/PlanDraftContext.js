import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../api/api";

const PlanDraftContext = createContext(null);

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
          exerciseId: `custom-${Date.now()}`,
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
            sets: e.sets,
            reps: e.reps,
            isCustom: e.isCustom,
          })),
        };

        const res = planId
          ? await api.put(`/plans/${planId}`, payload)
          : await api.post("/plans", payload);
        clearDraft();
        return res.data;
      } catch (err) {
        const msg =
          err.response?.data?.message || err.message || "Could not save plan";
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
