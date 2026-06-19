import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Layers, X } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SectionSkeleton from "../components/ui/SectionSkeleton";
import Seo from "../components/seo/Seo";
import { breadcrumbSchema } from "../seo/schema";
import SpecialtyGrid from "../components/specialties/SpecialtyGrid";
import { getDepartments } from "../services/content";

export default function SpecialtiesPage() {
  const [params] = useSearchParams();
  const [all, setAll] = useState(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(params.get("q") || "");

  useEffect(() => {
    let alive = true;
    getDepartments()
      .then((res) => alive && setAll(res.items))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = search.trim().toLowerCase();
    const items = q
      ? all.filter((s) => [s.name, s.description].some((f) => String(f ?? "").toLowerCase().includes(q)))
      : all;
    return items.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [all, search]);

  return (
    <div className="min-h-screen bg-canvas">
      <Seo
        title="Medical Specialties"
        description="Explore the medical specialties offered through Healtour's accredited network — each links to its treatments, doctors and hospitals."
        path="/specialties"
        jsonLd={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Specialties", path: "/specialties" }])}
      />
      <Navbar />
      <main className="pt-28 sm:pt-32">
        <section className="border-b border-slate-200/70 bg-surface-2/40 dark:border-slate-800/70">
          <div className="container-x py-10 sm:py-14">
            <span className="eyebrow"><Layers className="h-3.5 w-3.5" /> Medical Specialties</span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Care across every major specialty
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Explore the specialties offered through Healtour's accredited network — each links to the
              treatments, doctors and hospitals that deliver it.
            </p>
          </div>
        </section>

        <section className="container-x py-8">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search specialties, e.g. “cardiology”"
              aria-label="Search specialties"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-10 text-[14px] text-ink transition-colors placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {all && <p className="mt-5 text-sm text-ink-muted">{filtered.length} specialties</p>}
        </section>

        <section className="container-x pb-20">
          {error ? (
            <div className="rounded-3xl border border-dashed border-slate-200 py-20 text-center dark:border-white/10">
              <p className="text-sm font-medium text-ink-soft">Couldn't load specialties.</p>
              <p className="mt-1 text-sm text-ink-muted">Please refresh the page and try again.</p>
            </div>
          ) : !all ? (
            <SectionSkeleton cards={6} />
          ) : (
            <SpecialtyGrid specialties={filtered} />
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
