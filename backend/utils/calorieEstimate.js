const CARDIO_KEYWORDS = ["cardio", "run", "hiit", "conditioning", "circuit"];
const HEAVY_KEYWORDS = ["leg", "full body", "power"];

const pickMet = (planName = "") => {
  const lower = planName.toLowerCase();
  if (CARDIO_KEYWORDS.some((k) => lower.includes(k))) return 8.0;
  if (HEAVY_KEYWORDS.some((k) => lower.includes(k))) return 6.0;
  return 5.0;
};

const estimateCalories = (log, weightKg = 70) => {
  const minutes = (log.durationSec || 0) / 60;
  if (minutes <= 0) return 0;
  const met = pickMet(log.planName);
  const w = Math.max(30, Math.min(200, Number(weightKg) || 70));
  const kcal = met * w * (minutes / 60);
  return Math.round(kcal);
};

module.exports = { estimateCalories, pickMet };
