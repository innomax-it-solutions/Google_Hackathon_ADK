import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SearchableSelect from "../components/ui/SearchableSelect";
import SectionSkeleton from "../components/ui/SectionSkeleton";
import Seo from "../components/seo/Seo";
import { breadcrumbSchema } from "../seo/schema";
import TreatmentGrid from "../components/treatments/TreatmentGrid";
import { getTreatments } from "../services/content";

const PAGE_SIZE = 12;

const SORTS = [
  { value: "featured", label: "Featured first" },
  { value: "name", label: "Name (A–Z)" },
  { value: "stay", label: "Shortest stay" },
];

export default function TreatmentsPage() {
  const [params] = useSearchParams();
  const [all, setAll] = useState(null); // null = loading
  const [error, setError] = useState(false);

  const [search, setSearch] = useState(params.get("q") || "");
  const [department, setDepartment] = useState(params.get("specialty") || "");
  const [sort, setSort] = useState("featured");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let alive = true;
    getTreatments()
      .then((res) => alive && setAll(res.items))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  // Specialty facets (distinct departments + counts) from the full set.
  const departmentOptions = useMemo(() => {
    if (!all) return [];
    const counts = new Map();
    for (const t of all) {
      if (t.department) counts.set(t.department, (counts.get(t.department) || 0) + 1);
    }
    const opts = [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, n]) => ({ value: name, label: `${name} (${n})` }));
    return [{ value: "", label: "All specialties" }, ...opts];
  }, [all]);

  // Search → filter → sort, in the presentation layer (data already loaded/cached).
  const filtered = useMemo(() => {
    if (!all) return [];
    const q = search.trim().toLowerCase();
    let items = all.filter((t) => {
      if (department && t.department !== department) return false;
      if (!q) return true;
      return [t.name, t.department, t.shortDescription, t.description]
        .some((f) => String(f ?? "").toLowerCase().includes(q));
    });
    items = items.slice().sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "stay") return (a.days || Infinity) - (b.days || Infinity);
      // featured: show_on_home first, then name
      if (!!b.showOnHome !== !!a.showOnHome) return b.showOnHome ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    return items;
  }, [all, search, department, sort]);

  // Reset the visible window whenever the query changes.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, department, sort]);

  const shown = filtered.slice(0, visible);
  const hasFilters = search.trim() || department;

  function clearFilters() {
    setSearch("");
    setDepartment("");
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Seo
        title="Treatments & Procedures"
        description="Browse medical treatments and procedures offered through Healtour's accredited hospital network. Search by name or filter by specialty, then get a free cost estimate."
        path="/treatments"
        jsonLd={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Treatments", path: "/treatments" }])}
      />
      <Navbar />

      <main className="pt-28 sm:pt-32">
        {/* Header */}
        <section className="border-b border-slate-200/70 bg-surface-2/40 dark:border-slate-800/70">
          <div className="container-x py-10 sm:py-14">
            <span className="eyebrow">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Treatments & Procedures
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Explore treatments across{" "}
              {all && departmentOptions.length > 1
                ? `${departmentOptions.length - 1} specialties`
                : "every specialty"}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Browse procedures offered through Healtour's accredited hospital network. Search by name
              or filter by specialty — then get a free, itemised cost estimate.
            </p>
          </div>
        </section>

        {/* Controls */}
        <section className="container-x py-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search treatments, e.g. “knee replacement”"
                aria-label="Search treatments"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-10 text-[14px] text-ink transition-colors placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <div className="min-w-[13rem] flex-1 lg:flex-none">
                <SearchableSelect
                  value={department}
                  onChange={setDepartment}
                  options={departmentOptions}
                  placeholder="All specialties"
                  searchPlaceholder="Search specialties…"
                />
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort treatments"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[14px] text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result meta */}
          {all && (
            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-sm text-ink-muted">
                {filtered.length} {filtered.length === 1 ? "treatment" : "treatments"}
                {department && <> in <span className="font-medium text-ink-soft">{department}</span></>}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
                >
                  <X className="h-3.5 w-3.5" /> Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* Results */}
        <section className="container-x pb-20">
          {error ? (
            <div className="rounded-3xl border border-dashed border-slate-200 py-20 text-center dark:border-white/10">
              <p className="text-sm font-medium text-ink-soft">Couldn't load treatments.</p>
              <p className="mt-1 text-sm text-ink-muted">Please refresh the page and try again.</p>
            </div>
          ) : !all ? (
            <SectionSkeleton cards={6} />
          ) : (
            <>
              <TreatmentGrid treatments={shown} />
              {visible < filtered.length && (
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="btn-secondary"
                  >
                    Load more treatments
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
