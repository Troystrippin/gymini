import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "meal-plan-cache-v1";

// Cache shape: { date: "YYYY-MM-DD", entries: [...], totals: {...} }
export const mealPlanCache = {
  async load() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  async save(plan) {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(plan));
    } catch {
      // best-effort
    }
  },
  async clear() {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  },
};

export const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};