/**
 * Interpreter / translator languages.
 *
 * SUPPORT_LANGUAGES — the selectable set offered to the patient (form + chat).
 *   A superset that deliberately includes languages MedBridge does NOT provide
 *   (e.g. Tamil, German, Persian) so the "MedBridge: not available" state is real.
 *
 * MEDBRIDGE_TRANSLATOR_LANGUAGES — the languages MedBridge itself can staff an
 *   interpreter for (the 10 i18n languages). Per-hospital availability comes from
 *   each hospital's `translator_languages` (backend/data/hospital_registry.json).
 *
 * Codes are ISO 639-1 and must match the hospital data + LanguageContext.
 */

export const SUPPORT_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "ru", name: "Russian" },
  { code: "bn", name: "Bengali" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ur", name: "Urdu" },
  // Beyond MedBridge's own interpreter set:
  { code: "ta", name: "Tamil" },
  { code: "ml", name: "Malayalam" },
  { code: "de", name: "German" },
  { code: "fa", name: "Persian" },
  { code: "sw", name: "Swahili" },
  { code: "id", name: "Indonesian" },
  { code: "tr", name: "Turkish" },
];

// Languages MedBridge can provide an interpreter for (the 10 i18n languages).
export const MEDBRIDGE_TRANSLATOR_LANGUAGES = [
  "en", "hi", "ar", "fr", "es", "ru", "bn", "pt", "zh", "ur",
];

const NAME_BY_CODE = Object.fromEntries(SUPPORT_LANGUAGES.map((l) => [l.code, l.name]));

/** English name for a language code, falling back to the code itself. */
export function languageName(code) {
  return NAME_BY_CODE[code] || code;
}

const CODE_BY_NAME = Object.fromEntries(SUPPORT_LANGUAGES.map((l) => [l.name.toLowerCase(), l.code]));

/** Best-effort ISO code for a free-text language entry. Returns "" if unknown. */
export function languageCode(input) {
  const v = (input || "").trim().toLowerCase();
  if (!v) return "";
  if (NAME_BY_CODE[v]) return v;            // already a code
  return CODE_BY_NAME[v] || v;              // map a name, else pass through
}
