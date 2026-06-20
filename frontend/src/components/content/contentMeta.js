// ---------------------------------------------------------------------------
// Shared helpers for the editorial/content modules (blogs, patient stories,
// wellness, specialties). Reuses the specialty gradient + HTML sanitizer.
// ---------------------------------------------------------------------------

export { deptGradient as gradientFor, deptIcon, sanitizeHtml } from "../treatments/treatmentMeta";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format a "DD-MM-YYYY" date string as "29 Oct 2024"; returns input on failure. */
export function formatDate(raw) {
  if (!raw) return "";
  const m = String(raw).match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!m) return String(raw);
  const [, d, mo, y] = m;
  const mon = MONTHS[Number(mo) - 1];
  if (!mon) return String(raw);
  return `${Number(d)} ${mon} ${y}`;
}

/** Plain text from an HTML string. */
export function stripTags(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Rough reading time in minutes (>=1) from an HTML body. */
export function readingMinutes(html) {
  const words = stripTags(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
