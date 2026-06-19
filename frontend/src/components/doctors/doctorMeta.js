// ---------------------------------------------------------------------------
// Presentation helpers for the Doctors module. Reuses the shared specialty
// helpers so visuals stay consistent across modules. Doctor photo assets are
// NOT bundled, so avatars fall back to a gradient monogram.
// ---------------------------------------------------------------------------

export { deptIcon, deptGradient, sanitizeHtml } from "../treatments/treatmentMeta";

/** Initials from a doctor's name, dropping the "Dr." honorific. */
export function docInitials(name) {
  const words = String(name || "")
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s*/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^A-Za-z ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return ((words[0]?.[0] || "") + (words[1]?.[0] || "")).toUpperCase() || "Dr";
}
