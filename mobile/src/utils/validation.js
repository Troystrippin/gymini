export const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ'.\- ]+$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateFullName = (value) => {
  const v = (value || "").trim();
  if (!v) return "Full name is required";
  if (v.length < 2) return "Must be at least 2 characters";
  if (v.length > 80) return "Must be 80 characters or fewer";
  if (!NAME_REGEX.test(v))
    return "Only letters, spaces, hyphens, apostrophes, and periods";
  return null;
};

export const validateEmail = (value) => {
  const v = (value || "").trim();
  if (!v) return "Email is required";
  if (!EMAIL_REGEX.test(v)) return "Enter a valid email address";
  if (v.length > 254) return "Email is too long";
  return null;
};

export const validatePassword = (value) => {
  const v = value || "";
  if (!v) return "Password is required";
  if (v.length < 8) return "Must be at least 8 characters";
  if (v.length > 128) return "Must be 128 characters or fewer";
  if (!/[A-Za-z]/.test(v)) return "Must contain at least one letter";
  if (!/\d/.test(v)) return "Must contain at least one number";
  return null;
};

export const validateCurrentPassword = (value) => {
  const v = value || "";
  if (!v) return "Current password is required";
  if (v.length > 128) return "Password is too long";
  return null;
};

export const validateConfirmPassword = (value, original) => {
  const v = value || "";
  if (!v) return "Please confirm your password";
  if (v !== original) return "Passwords do not match";
  return null;
};

export const validateAge = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isInteger(n)) return "Must be a whole number";
  if (n < 13) return "Must be at least 13";
  if (n > 120) return "Must be 120 or less";
  return null;
};

export const validateHeight = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return "Must be a number";
  if (n < 50) return "Must be at least 50 cm";
  if (n > 300) return "Must be 300 cm or less";
  return null;
};

export const validateWeight = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return "Must be a number";
  if (n < 20) return "Must be at least 20 kg";
  if (n > 500) return "Must be 500 kg or less";
  return null;
};

export const validateWorkoutDays = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isInteger(n)) return "Must be a whole number";
  if (n < 0) return "Cannot be negative";
  if (n > 7) return "Must be 7 or less";
  return null;
};

export const validatePlanName = (value) => {
  const v = (value || "").trim();
  if (!v) return "Plan name is required";
  if (v.length > 30) return "Must be 30 characters or fewer";
  return null;
};

export const validateExerciseName = (value) => {
  const v = (value || "").trim();
  if (!v) return "Exercise name is required";
  if (v.length < 2) return "Must be at least 2 characters";
  if (v.length > 80) return "Must be 80 characters or fewer";
  return null;
};

// ─────────────────────────────────────────────────────────────
// Popup helper — builds a native Alert with all validation errors.
// Usage:
//   const errs = { email: "Email is required", password: "..." };
//   showValidationAlert("Sign-in Failed", errs, labels);
// ─────────────────────────────────────────────────────────────

/**
 * Show a native alert listing every failed field.
 *
 * @param {string} title - Alert title (e.g., "Sign-in Failed")
 * @param {object} errors - { fieldKey: errorMessage | null }
 * @param {object} labels - { fieldKey: "Human-friendly label" }
 */
export const showValidationAlert = (title, errors, labels = {}) => {
  const entries = Object.entries(errors).filter(([, msg]) => Boolean(msg));

  if (entries.length === 0) return false;

  const { Alert } = require("react-native");

  if (entries.length === 1) {
    const [field, msg] = entries[0];
    const label = labels[field];
    Alert.alert(title, label ? `${label}: ${msg}` : msg);
  } else {
    const body = entries
      .map(([field, msg]) => {
        const label = labels[field] || field;
        return `• ${label}: ${msg}`;
      })
      .join("\n");
    Alert.alert(title, body);
  }

  return true;
};