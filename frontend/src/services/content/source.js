/**
 * services/content/source.js — The single swap point for Healtour content.
 *
 * Today this serves static JSON snapshots bundled with the app, extracted from
 * the legacy MySQL dump (see frontend/scripts/extract_healtour_data.py). The
 * deployed React app must not depend on PHP or a live DB, so the content is
 * frozen into JSON and read synchronously from the bundle.
 *
 * To migrate to a live API later, replace the bodies here with `fetch()` calls.
 * Every function already returns a Promise and the public services/content API
 * (index.js) plus all call sites stay unchanged.
 */

// Each collection is loaded via dynamic import() so Vite code-splits it into its
// own chunk: the JSON (treatments.json alone is ~3.4MB) is only downloaded when a
// page first asks for it, keeping the initial bundle lean. This also mirrors a
// real network fetch, so the future API swap is a near drop-in.
const LOADERS = {
  hospitals: () => import("../../data/healtour/hospitals.json"),
  doctors: () => import("../../data/healtour/doctors.json"),
  treatments: () => import("../../data/healtour/treatments.json"),
  departments: () => import("../../data/healtour/departments.json"),
  blogs: () => import("../../data/healtour/blogs.json"),
  stories: () => import("../../data/healtour/stories.json"),
  wellness: () => import("../../data/healtour/wellness.json"),
};

/** Valid collection names — handy for guards and tests. */
export const COLLECTION_NAMES = Object.keys(LOADERS);

// Cache the resolved module promise per collection so repeat reads don't re-import.
const _cache = new Map();

/**
 * Fetch a whole collection by name. Async by contract so the future API swap is
 * transparent. Returns a fresh array so callers can sort/filter without mutating
 * the cached snapshot.
 */
export async function fetchCollection(name) {
  const load = LOADERS[name];
  if (!load) throw new Error(`Unknown content collection: "${name}"`);
  if (!_cache.has(name)) _cache.set(name, load());
  const mod = await _cache.get(name);
  return (mod.default ?? mod).slice();
}
