import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import api from "../api/api";

const PlanDraftContext = createContext(null);

const makeCustomId = () =>
  `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function PlanDraftProvider({ children }) {
  const [draftExercises, setDraftExercises] = useState([]);
  const [draftName, setDraftName] = useState("");
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [refreshingStatuses, setRefreshingStatuses] = useState(false);
  const [rejectedNotices, setRejectedNotices] = useState([]);

  // Mirror draftExercises in a ref so refreshDraftStatuses can read the
  // latest value without depending on the array identity.
  const draftRef = useRef(draftExercises);
  draftRef.current = draftExercises;

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
          isCustom: Boolean(exercise.isCustom),
          status: exercise.status || "approved",
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
          status: "pending",
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
    setDraftName("");
    setEditingPlanId(null);
    setSaveError(null);
  }, []);

  const replaceDraft = useCallback(
    (exercises) =>
      setDraftExercises(exercises.map((exercise) => ({ ...exercise }))),
    [],
  );

  const loadPlanForEdit = useCallback((plan) => {
    setDraftExercises(
      (plan.exercises || []).map((ex, idx) => ({
        exerciseId: ex.exerciseId || `custom-${idx}-${Date.now()}`,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        description: ex.description || "",
        sets: ex.sets,
        reps: ex.reps,
        isCustom: ex.isCustom,
        status: ex.status || "approved",
      })),
    );
    setDraftName(plan.name || "");
    setEditingPlanId(plan._id);
    setSaveError(null);
  }, []);

  const unapprovedExercises = useMemo(
    () =>
      draftExercises.filter(
        (e) => e.status === "pending" || e.status === "rejected",
      ),
    [draftExercises],
  );

  const hasUnapprovedExercises = unapprovedExercises.length > 0;

  // Stable callback — reads current draft via ref, so its identity never
  // changes. Also removes rejected exercises from the draft and queues a
  // notification so the UI can inform the user.
  const refreshDraftStatuses = useCallback(async () => {
    const current = draftRef.current || [];
    const candidates = current.filter(
      (e) =>
        e.exerciseId &&
        !String(e.exerciseId).startsWith("custom-") &&
        (e.status === "pending" || e.status === "rejected"),
    );
    if (candidates.length === 0) return;

    setRefreshingStatuses(true);
    try {
      const results = await Promise.all(
        candidates.map((e) =>
          api
            .get(`/exercises/${e.exerciseId}`)
            .then(
              (res) => ({
                id: e.exerciseId,
                status: res.data.status,
                reason: res.data.rejectionReason || null,
              }),
              () => null,
            ),
        ),
      );

      const rejectedIds = new Set(
        results
          .filter((r) => r && r.status === "rejected")
          .map((r) => r.id),
      );

      const rejectedItems = current
        .filter((e) => rejectedIds.has(e.exerciseId))
        .map((e) => {
          const r = results.find((x) => x && x.id === e.exerciseId);
          return { name: e.name, reason: r?.reason || null };
        });

      setDraftExercises((prev) => {
        let next = prev.filter((ex) => !rejectedIds.has(ex.exerciseId));
        next = next.map((ex) => {
          const match = results.find(
            (r) => r && r.id === ex.exerciseId && r.status !== ex.status,
          );
          return match ? { ...ex, status: match.status } : ex;
        });
        return next;
      });

      if (rejectedItems.length > 0) {
        setRejectedNotices(rejectedItems);
      }
    } catch (err) {
      console.warn("[draft] refresh statuses failed:", err.message);
    } finally {
      setRefreshingStatuses(false);
    }
  }, []);

  const clearRejectedNotices = useCallback(() => {
    setRejectedNotices([]);
  }, []);

  const savePlan = useCallback(
    async (planName = "My Plan", planId = null) => {
      if (draftExercises.length === 0) {
        throw new Error("Add at least one exercise before saving.");
      }

      const unapproved = draftExercises.filter(
        (e) => e.status === "pending" || e.status === "rejected",
      );
      if (unapproved.length > 0) {
        const names = unapproved.map((e) => e.name).join(", ");
        const msg = `Cannot save plan while these exercises are awaiting approval: ${names}. Remove them or wait for approval.`;
        setSaveError(msg);
        throw new Error(msg);
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
        draftName,
        setDraftName,
        editingPlanId,
        setEditingPlanId,
        addExercise,
        addCustomExercise,
        removeExercise,
        updateExercise,
        reorderExercises,
        isInDraft,
        clearDraft,
        replaceDraft,
        loadPlanForEdit,
        savePlan,
        savingPlan,
        saveError,
        unapprovedExercises,
        hasUnapprovedExercises,
        refreshDraftStatuses,
        refreshingStatuses,
        rejectedNotices,
        clearRejectedNotices,
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