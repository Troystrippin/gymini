// Rough calories-burned estimate from workout duration + user weight.
// Formula: kcal ≈ MET × weightKg × hours
// MET values are conservative for strength/circuit training.
// Cardio-heavy plans get a slightly higher MET.

const CARDIO_KEYWORDS = ["cardio", "run", "hiit", "conditioning", "circuit"];
const HEAVY_KEYWORDS = ["leg", "full body", "power"];

const pickMet = (planName = "") => {
  const lower = planName.toLowerCase();
  if (CARDIO_KEYWORDS.some((k) => lower.includes(k))) return 8.0;
  if (HEAVY_KEYWORDS.some((k) => lower.includes(k))) return 6.0;
  return 5.0; // default strength training
};

/**
 * @param {Object} log  WorkoutLog doc (needs durationSec, planName)
 * @param {Number} weightKg  User weight in kg (fallback 70)
 * @returns {Number} estimated calories burned (rounded)
 */
const estimateCalories = (log, weightKg = 70) => {
  const minutes = (log.durationSec || 0) / 60;
  if (minutes <= 0) return 0;
  const met = pickMet(log.planName);
  const w = Math.max(30, Math.min(200, Number(weightKg) || 70));
  const kcal = met * w * (minutes / 60);
  return Math.round(kcal);
};

module.exports = { estimateCalories, pickMet };