import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Building2, X } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SearchableSelect from "../components/ui/SearchableSelect";
import SectionSkeleton from "../components/ui/SectionSkeleton";
import Seo from "../components/seo/Seo";
import { breadcrumbSchema } from "../seo/schema";
import HospitalGrid from "../components/hospitals/HospitalGrid";
import { getHospitals } from "../services/content";

const SORTS = [
  { value: "featured", label: "Featured first" },
  { value: "name", label: "Name (A–Z)" },
  { value: "doctors", label: "Most doctors" },
];

export default function HospitalsPage() {
  const [params] = useSearchParams();
  const [all, setAll] = useState(null);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState(params.get("q") || "");
  const [city, setCity] = useState(params.get("city") || "");
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    let alive = true;
    getHospitals()
      .then((res) => alive && setAll(res.items))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const cityOptions = useMemo(() => {
    if (!all) return [];
    const counts = new Map();
    for (const h of all) {
      if (h.city) counts.set(h.city, (counts.get(h.city) || 0) + 1);
    }
    const opts = [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, n]) => ({ value: name, label: `${name} (${n})` }));
    return [{ value: "", label: "All cities" }, ...opts];
  }, [all]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = search.trim().toLowerCase();
    let items = all.filter((h) => {
      if (city && h.city !== city) return false;
      if (!q) return true;
      return [h.name, h.city, h.state, h.country, h.description, ...(h.departments || [])]
        .some((f) => String(f ?? "").toLowerCase().includes(q));
    });
    items = items.slice().sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "doctors") return (b.numberOfDoctors || 0) - (a.numberOfDoctors || 0);
      // featured: show_on_home first, then priority, then name
      if (!!b.showOnHome !== !!a.showOnHome) return b.showOnHome ? 1 : -1;
      if ((a.priority || 0) !== (b.priority || 0)) return (b.priority || 0) - (a.priority || 0);
      return a.name.localeCompare(b.name);
    });
    return items;
  }, [all, search, city, sort]);

  const hasFilters = search.trim() || city;

  function clearFilters() {
    setSearch("");
    setCity("");
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Seo
        title="Accredited Hospitals"
        description="Explore Healtour's network of internationally accredited partner hospitals across India. Filter by city and explore departments, doctors and treatments."
        path="/hospitals"
        jsonLd={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Hospitals", path: "/hospitals" }])}
      />
      <Navbar />

      <main className="pt-28 sm:pt-32">
        <section className="border-b border-slate-200/70 bg-surface-2/40 dark:border-slate-800/70">
          <div className="container-x py-10 sm:py-14">
            <span className="eyebrow">
              <Building2 className="h-3.5 w-3.5" /> Accredited Hospitals
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Explore Healtour's partner hospital network
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Internationally accredited hospitals across India. Search by name or filter by city,
              then explore departments, doctors and treatments — or get a cost estimate.
            </p>
          </div>
        </section>

        <section className="container-x py-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hospitals, e.g. “Apollo” or “cardiology”"
                aria-label="Search hospitals"
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
              <div className="min-w-[12rem] flex-1 lg:flex-none">
                <SearchableSelect
                  value={city}
                  onChange={setCity}
                  options={cityOptions}
                  placeholder="All cities"
                  searchPlaceholder="Search cities…"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort hospitals"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[14px] text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {all && (
            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-sm text-ink-muted">
                {filtered.length} {filtered.length === 1 ? "hospital" : "hospitals"}
                {city && <> in <span className="font-medium text-ink-soft">{city}</span></>}
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

        <section className="container-x pb-20">
          {error ? (
            <div className="rounded-3xl border border-dashed border-slate-200 py-20 text-center dark:border-white/10">
              <p className="text-sm font-medium text-ink-soft">Couldn't load hospitals.</p>
              <p className="mt-1 text-sm text-ink-muted">Please refresh the page and try again.</p>
            </div>
          ) : !all ? (
            <SectionSkeleton cards={6} />
          ) : (
            <HospitalGrid hospitals={filtered} />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
