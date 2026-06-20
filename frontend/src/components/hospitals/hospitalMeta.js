// ---------------------------------------------------------------------------
// Presentation helpers for the Hospitals module. Reuses the treatment helpers
// (deptIcon / deptGradient / sanitizeHtml) so specialties look consistent
// across modules. Hospital photo/accreditation image assets are NOT bundled, so
// visuals fall back to gradient + monogram tiles.
// ---------------------------------------------------------------------------

export { deptIcon, deptGradient, sanitizeHtml } from "../treatments/treatmentMeta";

/** Up-to-2-letter monogram for a hospital name. */
export function initials(name) {
  const words = String(name || "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const mark = (words[0]?.[0] || "") + (words[1]?.[0] || "");
  return mark.toUpperCase() || "H";
}

/** "City, State" (or whatever is present). */
export function shortLocation(h) {
  return [h?.city, h?.state].filter(Boolean).join(", ");
}

/** Full location line including country. */
export function fullLocation(h) {
  return [h?.address, h?.city, h?.state, h?.country].filter(Boolean).join(", ");
}

/** Keyless Google Maps embed URL built from the hospital's name + location. */
export function mapEmbedUrl(h) {
  const q = [h?.name, h?.city, h?.state, h?.country].filter(Boolean).join(", ");
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

/** Whether the hospital carries any accreditation. */
export function isAccredited(h) {
  return Array.isArray(h?.accreditationLogos) && h.accreditationLogos.length > 0;
}

/** Compact stat tiles derived from real fields (skips missing values). */
export function hospitalStats(h) {
  return [
    h?.numberOfBeds && { icon: "BedDouble", label: "Beds", value: h.numberOfBeds },
    h?.numberOfDoctors && { icon: "Stethoscope", label: "Doctors", value: `${h.numberOfDoctors}+` },
    h?.yearEstablished && { icon: "Calendar", label: "Established", value: h.yearEstablished },
    h?.departments?.length && { icon: "Layers", label: "Departments", value: h.departments.length },
  ].filter(Boolean);
}
