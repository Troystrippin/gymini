export const MEAL_SELECTION_KEY = "selected-meal-plan";
export const SELECTED_MEALS_KEY = "selected-meals";

export const MEALS = [
  {
    id: "oatmeal-banana",
    type: "Breakfast",
    name: "Oatmeal with banana",
    goal: "Balanced",
    tags: ["High Fiber", "Quick"],
    calories: "420 kcal",
    protein: "14g protein",
    image: "",
    description:
      "Rolled oats simmered until creamy, topped with sliced banana, a drizzle of honey, and a pinch of cinnamon.",
  },
  {
    id: "eggs-avocado",
    type: "Breakfast",
    name: "Eggs, toast, and avocado",
    goal: "High Protein",
    tags: ["High Protein"],
    calories: "520 kcal",
    protein: "30g protein",
    image: "",
    description:
      "Two scrambled eggs with whole-grain toast and smashed avocado, finished with a squeeze of lemon and chili flakes.",
  },
  {
    id: "chicken-rice",
    type: "Lunch",
    name: "Chicken rice bowl",
    goal: "High Protein",
    tags: ["High Protein", "Balanced"],
    calories: "620 kcal",
    protein: "42g protein",
    image: "",
    description:
      "Grilled chicken breast over steamed rice with sautéed vegetables and a light soy-garlic glaze.",
  },
  {
    id: "tuna-wrap",
    type: "Lunch",
    name: "Tuna salad wrap",
    goal: "Weight Loss",
    tags: ["Weight Loss", "High Protein"],
    calories: "480 kcal",
    protein: "34g protein",
    image: "",
    description:
      "Tuna mixed with light mayo, celery, and onion, wrapped in a whole-wheat tortilla with crisp lettuce.",
  },
  {
    id: "salmon-vegetables",
    type: "Dinner",
    name: "Salmon with vegetables",
    goal: "Balanced",
    tags: ["High Protein", "Balanced"],
    calories: "560 kcal",
    protein: "38g protein",
    image: "",
    description:
      "Pan-seared salmon fillet served with roasted broccoli, carrots, and a wedge of lemon.",
  },
  {
    id: "chicken-vegetables",
    type: "Dinner",
    name: "Chicken with roasted vegetables",
    goal: "Weight Loss",
    tags: ["Weight Loss", "High Protein"],
    calories: "520 kcal",
    protein: "40g protein",
    image: "",
    description:
      "Herb-roasted chicken thigh with a medley of roasted zucchini, bell peppers, and red onion.",
  },
  {
    id: "greek-yogurt",
    type: "Snack",
    name: "Greek yogurt with fruit",
    goal: "High Protein",
    tags: ["High Protein", "Quick"],
    calories: "220 kcal",
    protein: "18g protein",
    image: "",
    description:
      "Plain Greek yogurt topped with mixed berries and a light drizzle of honey.",
  },
  {
    id: "apple-peanut-butter",
    type: "Snack",
    name: "Apple with peanut butter",
    goal: "Weight Loss",
    tags: ["Weight Loss", "Quick"],
    calories: "180 kcal",
    protein: "7g protein",
    image: "",
    description:
      "Crisp apple slices paired with a tablespoon of natural peanut butter for a quick, satisfying snack.",
  },
];

export const MEAL_PLANS = [
  {
    id: "balanced",
    name: "Balanced Plan",
    goal: "Everyday health",
    calories: "2,000 kcal",
    meals: [
      { type: "Breakfast", name: "Oatmeal with banana", calories: "420 kcal" },
      { type: "Lunch", name: "Chicken rice bowl", calories: "620 kcal" },
      { type: "Dinner", name: "Salmon with vegetables", calories: "560 kcal" },
      { type: "Snack", name: "Greek yogurt with fruit", calories: "220 kcal" },
    ],
  },
  {
    id: "high-protein",
    name: "High Protein Plan",
    goal: "Build muscle",
    calories: "2,400 kcal",
    meals: [
      {
        type: "Breakfast",
        name: "Eggs, toast, and avocado",
        calories: "520 kcal",
      },
      { type: "Lunch", name: "Turkey quinoa bowl", calories: "700 kcal" },
      { type: "Dinner", name: "Lean beef with potatoes", calories: "680 kcal" },
      { type: "Snack", name: "Protein shake", calories: "260 kcal" },
    ],
  },
  {
    id: "weight-loss",
    name: "Weight Loss Plan",
    goal: "Lose weight",
    calories: "1,700 kcal",
    meals: [
      { type: "Breakfast", name: "Berry yogurt bowl", calories: "320 kcal" },
      { type: "Lunch", name: "Tuna salad wrap", calories: "480 kcal" },
      {
        type: "Dinner",
        name: "Chicken with roasted vegetables",
        calories: "520 kcal",
      },
      { type: "Snack", name: "Apple with peanut butter", calories: "180 kcal" },
    ],
  },
];
