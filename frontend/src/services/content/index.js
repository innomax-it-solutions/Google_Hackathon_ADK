/**
 * services/content/index.js — Public content API for Healtour entities.
 *
 * Pages and components import from here, never from source.js or the raw JSON.
 * Swapping the static snapshot for a live API only touches source.js.
 *
 * Every getter is async (returns a Promise) so call sites are API-ready.
 * Listing getters accept a shared query shape:
 *   { search, filters, sort, dir, page, pageSize }
 * and return { items, total, page, pageSize, pageCount } for easy pagination.
 */

import { fetchCollection } from "./source";

// --- generic query engine ---------------------------------------------------

function matchesSearch(item, search, fields) {
  if (!search) return true;
  const q = String(search).trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => String(item[f] ?? "").toLowerCase().includes(q));
}

function matchesFilters(item, filters) {
  // Each filter: equality for scalars, "includes" for array-valued item fields.
  return Object.entries(filters || {}).every(([key, want]) => {
    if (want == null || want === "" || want === "all") return true;
    const have = item[key];
    if (Array.isArray(have)) return have.includes(want);
    return String(have ?? "").toLowerCase() === String(want).toLowerCase();
  });
}

function applySort(items, sort, dir) {
  if (!sort) return items;
  const factor = dir === "desc" ? -1 : 1;
  return items.slice().sort((a, b) => {
    const av = a[sort];
    const bv = b[sort];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
    return String(av ?? "").localeCompare(String(bv ?? "")) * factor;
  });
}

function paginate(items, page, pageSize) {
  const total = items.length;
  if (!pageSize) {
    return { items, total, page: 1, pageSize: total, pageCount: 1 };
  }
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page || 1), pageCount);
  const start = (p - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page: p, pageSize, pageCount };
}

/**
 * Run a search/filter/sort/paginate query over a collection.
 * `searchFields` is the list of item keys full-text search scans.
 */
async function query(name, { search, filters, sort, dir, page, pageSize } = {}, searchFields = []) {
  let items = await fetchCollection(name);
  items = items.filter(
    (it) => matchesSearch(it, search, searchFields) && matchesFilters(it, filters),
  );
  items = applySort(items, sort, dir);
  return paginate(items, page, pageSize);
}

async function findBySlug(name, slug) {
  const items = await fetchCollection(name);
  return items.find((x) => x.slug === slug) || null;
}

// --- Hospitals ---------------------------------------------------------------

export const getHospitals = (opts) =>
  query("hospitals", opts, ["name", "city", "state", "country", "description"]);
export const getHospitalBySlug = (slug) => findBySlug("hospitals", slug);

// --- Doctors -----------------------------------------------------------------

export const getDoctors = (opts) =>
  query("doctors", opts, ["name", "designation", "hospital", "city", "bio"]);
export const getDoctorBySlug = (slug) => findBySlug("doctors", slug);

// --- Treatments --------------------------------------------------------------

export const getTreatments = (opts) =>
  query("treatments", opts, ["name", "department", "shortDescription", "description"]);
export const getTreatmentBySlug = (slug) => findBySlug("treatments", slug);

// --- Departments / specialties ----------------------------------------------

export const getDepartments = (opts) =>
  query("departments", opts, ["name", "description"]);
export const getDepartmentBySlug = (slug) => findBySlug("departments", slug);

// --- Blog / news -------------------------------------------------------------

export const getBlogs = (opts) =>
  query("blogs", opts, ["title", "excerpt", "category", "publisher"]);
export const getBlogBySlug = (slug) => findBySlug("blogs", slug);

// --- Patient stories ---------------------------------------------------------

export const getStories = (opts) =>
  query("stories", opts, ["title", "excerpt", "category"]);
export const getStoryBySlug = (slug) => findBySlug("stories", slug);

// --- Wellness packages -------------------------------------------------------

export const getWellness = (opts) =>
  query("wellness", opts, ["name", "shortDescription", "description", "location"]);
export const getWellnessBySlug = (slug) => findBySlug("wellness", slug);

// --- Cross-entity convenience -----------------------------------------------

/** Featured items for the homepage (the legacy `show_on_home` flag). */
export async function getHomeFeatured() {
  const [hospitals, doctors, treatments, departments] = await Promise.all([
    fetchCollection("hospitals"),
    fetchCollection("doctors"),
    fetchCollection("treatments"),
    fetchCollection("departments"),
  ]);
  return {
    hospitals: hospitals.filter((h) => h.showOnHome),
    doctors: doctors.filter((d) => d.showOnHome),
    treatments: treatments.filter((t) => t.showOnHome),
    departments: departments.filter((d) => d.showOnHome),
  };
}
