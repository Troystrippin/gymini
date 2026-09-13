import React, { createContext, useContext, useState, useCallback } from "react";

const PlanDraftContext = createContext(null);

export function PlanDraftProvider({ children }) {
  const [draftExercises, setDraftExercises] = useState([]);

  const addExercise = useCallback((exercise) => {
    setDraftExercises((prev) => {
      if (prev.some((e) => e.exerciseId === exercise._id)) return prev;
      return [
        ...prev,
        {
          exerciseId: exercise._id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          sets: 3,
          reps: 10,
          isCustom: false,
        },
      ];
    });
  }, []);

  // Custom exercise: not part of the dev-seeded catalog, lives only on this plan.
  // exerciseId is a temp client-side id (isCustom: true tells the backend not to
  // treat it as a ref into the Exercise collection).
  const addCustomExercise = useCallback((name, description = "") => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDraftExercises((prev) => [
      ...prev,
      {
        exerciseId: `custom-${Date.now()}`,
        name: trimmed,
        description: description.trim(),
        muscleGroup: null,
        sets: 3,
        reps: 10,
        isCustom: true,
      },
    ]);
  }, []);

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

  const clearDraft = useCallback(() => setDraftExercises([]), []);
  const replaceDraft = useCallback(
    (exercises) =>
      setDraftExercises(exercises.map((exercise) => ({ ...exercise }))),
    [],
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
