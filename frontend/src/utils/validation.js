/**
 * Small, dependency-free form validators. Each returns an error string
 * (empty string === valid) so callers can drop the result straight into state.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Permissive international phone check: digits, spaces, and + ( ) - . separators.
const PHONE_RE = /^[+]?[\d][\d\s().-]{6,}$/;

export function validateEmail(value) {
  const v = (value ?? "").trim();
  if (!v) return "Email is required.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return "";
}

export function validateRequired(value, label = "This field") {
  return (value ?? "").trim() ? "" : `${label} is required.`;
}

export function validatePassword(value, { min = 8 } = {}) {
  const v = value ?? "";
  if (!v) return "Password is required.";
  if (v.length < min) return `Password must be at least ${min} characters.`;
  return "";
}

export function validateConfirmPassword(value, original) {
  if (!value) return "Please confirm your password.";
  if (value !== original) return "Passwords do not match.";
  return "";
}

export function validatePhone(value) {
  const v = (value ?? "").trim();
  if (!v) return "Phone number is required.";
  if (!PHONE_RE.test(v)) return "Enter a valid phone number.";
  return "";
}

/** A simple 0–4 password-strength score with a human label. */
export function passwordStrength(value = "") {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}
