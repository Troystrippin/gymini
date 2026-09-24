// Catalog now lives on the backend (/api/meals).
// These keys are kept only for backward compatibility.
export const MEAL_SELECTION_KEY = "selected-meal-plan";
export const SELECTED_MEALS_KEY = "selected-meals";

// Empty fallback for any code still importing MEALS.
// Screens should read from useMealPlan().catalog instead.
export const MEALS = [];
export const MEAL_PLANS = [];