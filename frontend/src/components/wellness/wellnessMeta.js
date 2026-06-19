// Helpers for the Wellness module. Reuses the shared gradient + sanitizer.
export { deptGradient as gradientFor, sanitizeHtml } from "../treatments/treatmentMeta";

/**
 * Parse a price string like "$250" plus an optional discount % into display
 * parts. Returns null when there's no usable number.
 */
export function priceInfo(w) {
  const raw = String(w?.price || "");
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!num || Number.isNaN(num)) return null;
  const symbol = (raw.match(/^[^\d.]*/)?.[0] || "$").trim() || "$";
  const discount = Number(w?.discountPercentage) || 0;
  const final = discount > 0 ? Math.round(num * (1 - discount / 100)) : Math.round(num);
  return {
    symbol,
    discount,
    original: num,
    final,
    originalLabel: `${symbol}${num}`,
    finalLabel: `${symbol}${final}`,
  };
}
