/**
 * Profile storage helpers — browser-only, per logged-in user.
 *
 * Like utils/auth.js there is NO backend here. The patient's health + customer
 * details are persisted in localStorage, keyed by the logged-in user's email so
 * different demo accounts don't clobber each other. The profile then auto-feeds
 * the Hospital Finder intake (see profileToIntake).
 */

const KEY_PREFIX = "medbridge-profile:";

/** Blank profile — also documents every field the Profile tab edits. */
export const EMPTY_PROFILE = {
  // Customer / contact
  fullName: "",
  phone: "",
  origin_country: "",      // 2-letter ISO (matches IntakeRequest.origin_country)
  city: "",                // departure city
  dateOfBirth: "",         // YYYY-MM-DD
  passportNumber: "",
  preferredLanguage: "",   // ISO 639-1 — used as interpreter_language
  emergencyContact: "",
  travellers: 1,
  // Health
  sex: "",
  bloodGroup: "",
  heightCm: "",
  weightKg: "",
  conditions: "",          // free text, comma/line separated
  medications: "",
  allergies: "",
  pastSurgeries: "",
  notes: "",
};

function keyFor(email) {
  return KEY_PREFIX + (email || "guest").trim().toLowerCase();
}

/** Read a saved profile for this user, merged onto EMPTY_PROFILE. */
export function readProfile(email) {
  if (typeof window === "undefined") return { ...EMPTY_PROFILE };
  try {
    const raw = window.localStorage.getItem(keyFor(email));
    if (!raw) return { ...EMPTY_PROFILE };
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

/** Persist the profile for this user. */
export function writeProfile(email, profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(email), JSON.stringify(profile));
  } catch {
    /* ignore quota / availability errors */
  }
}

/** True once the patient has filled the essentials. */
export function isProfileComplete(profile) {
  if (!profile) return false;
  return Boolean(profile.fullName?.trim() && profile.origin_country);
}

/**
 * Build a partial Hospital-Finder intake from the saved profile (+ an optional
 * analysed report). Only returns fields the user actually filled, so it can be
 * spread over the form's INITIAL_FORM without wiping defaults.
 */
export function profileToIntake(profile = {}, analysis = null) {
  const intake = {};
  if (analysis?.condition) intake.condition = analysis.condition;
  if (profile.origin_country) intake.origin_country = profile.origin_country;
  if (profile.preferredLanguage) intake.interpreter_language = profile.preferredLanguage;
  if (profile.city) intake.departure_city = profile.city;
  const t = Number(profile.travellers);
  if (Number.isFinite(t) && t >= 1) intake.travellers = t;
  return intake;
}
