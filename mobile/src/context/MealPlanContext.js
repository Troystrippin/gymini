import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { mealApi } from "../api/mealApi";
import { mealPlanCache, todayKey, yesterdayKey } from "../storage/mealPlanCache";
import { sumMacros, groupByType } from "../utils/nutrition";
import { AuthContext } from "./AuthContext";

export const MealPlanContext = createContext(null);

export const MealPlanProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  const [entries, setEntries] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  // ─── Initial load + cache fallback ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await mealPlanCache.load();
      if (cached?.date === todayKey() && !cancelled) {
        setEntries(cached.entries || []);
      }

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [plan, meals, recs] = await Promise.all([
          mealApi.getPlan(todayKey()),
          mealApi.list(),
          mealApi.recommendations(),
        ]);
        if (cancelled) return;
        setEntries(plan.entries || []);
        setCatalog(meals || []);
        setRecommendations(recs?.meals || []);
        setOffline(false);
        await mealPlanCache.save(plan);
      } catch (err) {
        if (cancelled) return;
        setOffline(true);
        // Keep cached entries. Try to load catalog from cache too.
        console.warn("[meals] using cache, fetch failed:", err.message);
      } finally {
        if (!cancelled) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ─── Helpers ────────────────────────────────────────────────
  const persistLocal = useCallback(async (nextEntries) => {
    const totals = sumMacros(nextEntries);
    await mealPlanCache.save({
      date: todayKey(),
      entries: nextEntries,
      totals,
    });
  }, []);

  const addEntry = useCallback(
    async (meal) => {
      if (entries.some((e) => e.mealId === meal.id)) return;

      const next = [
        ...entries,
        {
          mealId: meal.id,
          type: meal.type,
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs || 0,
          fats: meal.fats || 0,
        },
      ];
      setEntries(next);
      await persistLocal(next);

      try {
        const plan = await mealApi.addMeal(meal.id, todayKey());
        setEntries(plan.entries || []);
        setOffline(false);
        await mealPlanCache.save(plan);
      } catch (err) {
        setOffline(true);
        console.warn("[meals] add failed, kept locally:", err.message);
      }
    },
    [entries, persistLocal],
  );

  const removeEntry = useCallback(
    async (mealId) => {
      const next = entries.filter((e) => e.mealId !== mealId);
      setEntries(next);
      await persistLocal(next);

      try {
        const plan = await mealApi.removeMeal(mealId, todayKey());
        setEntries(plan.entries || []);
        setOffline(false);
        await mealPlanCache.save(plan);
      } catch (err) {
        setOffline(true);
        console.warn("[meals] remove failed, kept locally:", err.message);
      }
    },
    [entries, persistLocal],
  );

  const toggleEntry = useCallback(
    async (meal) => {
      if (entries.some((e) => e.mealId === meal.id)) {
        await removeEntry(meal.id);
      } else {
        await addEntry(meal);
      }
    },
    [entries, addEntry, removeEntry],
  );

  const repeatYesterday = useCallback(async () => {
    try {
      const plan = await mealApi.repeatPlan(yesterdayKey(), todayKey());
      setEntries(plan.entries || []);
      setOffline(false);
      await mealPlanCache.save(plan);
      return { ok: true };
    } catch (err) {
      const msg =
        err.response?.data?.message || "Could not repeat yesterday's plan.";
      console.warn("[meals] repeat failed:", msg);
      return { ok: false, message: msg };
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [plan, meals, recs] = await Promise.all([
        mealApi.getPlan(todayKey()),
        mealApi.list(),
        mealApi.recommendations(),
      ]);
      setEntries(plan.entries || []);
      setCatalog(meals || []);
      setRecommendations(recs?.meals || []);
      setOffline(false);
      await mealPlanCache.save(plan);
    } catch (err) {
      setOffline(true);
    }
  }, []);

  // ─── Derived ────────────────────────────────────────────────
  const selectedIds = useMemo(
    () => entries.map((e) => e.mealId),
    [entries],
  );
  const totals = useMemo(() => sumMacros(entries), [entries]);
  const byType = useMemo(() => groupByType(entries), [entries]);

  const value = {
    entries,
    selectedIds,
    totals,
    byType,
    catalog,
    recommendations,
    offline,
    loading,
    addEntry,
    removeEntry,
    toggleEntry,
    repeatYesterday,
    refresh,
  };

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  );
};

export const useMealPlan = () => {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error("useMealPlan must be used inside MealPlanProvider");
  return ctx;
};