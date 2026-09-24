// Numeric macro helpers. Meals from the API are numeric already;
// these helpers also tolerate legacy string values ("420 kcal").

export const parseCalories = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const n = parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
};

export const parseProtein = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const n = parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
};

const num = (v) => (typeof v === "number" ? v : parseCalories(v));

export const sumMacros = (meals = []) =>
  meals.reduce(
    (acc, m) => {
      acc.calories += num(m.calories);
      acc.protein += num(m.protein);
      acc.carbs += num(m.carbs);
      acc.fats += num(m.fats);
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );

export const MEAL_TYPE_ORDER = ["Breakfast", "Lunch", "Dinner", "Snack"];

export const groupByType = (meals = []) =>
  MEAL_TYPE_ORDER.map((type) => ({
    type,
    meal: meals.find((m) => m.type === type) || null,
  }));

export const formatCalories = (n) => `${Math.round(n)} kcal`;
export const formatProtein = (n) => `${Math.round(n)}g`;