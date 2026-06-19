import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Stethoscope, X } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SearchableSelect from "../components/ui/SearchableSelect";
import SectionSkeleton from "../components/ui/SectionSkeleton";
import Seo from "../components/seo/Seo";
import { breadcrumbSchema } from "../seo/schema";
import DoctorGrid from "../components/doctors/DoctorGrid";
import { getDoctors } from "../services/content";

const PAGE_SIZE = 16;

const SORTS = [
  { value: "featured", label: "Featured first" },
  { value: "name", label: "Name (A–Z)" },
  { value: "experience", label: "Most experienced" },
];

const yearsOf = (exp) => {
  const m = String(exp || "").match(/\d+/);
  return m ? Number(m[0]) : 0;
};

export default function DoctorsPage() {
  const [params] = useSearchParams();
  const [all, setAll] = useState(null);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState(params.get("q") || "");
  const [specialty, setSpecialty] = useState(params.get("specialty") || "");
  const [hospital, setHospital] = useState(params.get("hospital") || "");
  const [sort, setSort] = useState("featured");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let alive = true;
    getDoctors()
      .then((res) => alive && setAll(res.items))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const specialtyOptions = useMemo(() => {
    if (!all) return [];
    const counts = new Map();
    for (const d of all) {
      for (const dep of d.departments || []) counts.set(dep, (counts.get(dep) || 0) + 1);
    }
    const opts = [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, n]) => ({ value: name, label: `${name} (${n})` }));
    return [{ value: "", label: "All specialties" }, ...opts];
  }, [all]);

  const hospitalOptions = useMemo(() => {
    if (!all) return [];
    const counts = new Map();
    for (const d of all) {
      if (d.hospital) counts.set(d.hospital, (counts.get(d.hospital) || 0) + 1);
    }
    const opts = [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, n]) => ({ value: name, label: `${name} (${n})` }));
    return [{ value: "", label: "All hospitals" }, ...opts];
  }, [all]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = search.trim().toLowerCase();
    let items = all.filter((d) => {
      if (specialty && !(d.departments || []).includes(specialty)) return false;
      if (hospital && d.hospital !== hospital) return false;
      if (!q) return true;
      return [d.name, d.designation, d.hospital, d.city, ...(d.departments || [])]
        .some((f) => String(f ?? "").toLowerCase().includes(q));
    });
    items = items.slice().sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "experience") return yearsOf(b.experience) - yearsOf(a.experience);
      if (!!b.showOnHome !== !!a.showOnHome) return b.showOnHome ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    return items;
  }, [all, search, specialty, hospital, sort]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, specialty, hospital, sort]);

  const shown = filtered.slice(0, visible);
  const hasFilters = search.trim() || specialty || hospital;

  function clearFilters() {
    setSearch("");
    setSpecialty("");
    setHospital("");
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Seo
        title="Specialist Doctors"
        description="Meet credentialed specialist doctors across Healtour's accredited hospital network. Search by name or filter by specialty and hospital."
        path="/doctors"
        jsonLd={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Doctors", path: "/doctors" }])}
      />
      <Navbar />

      <main className="pt-28 sm:pt-32">
        <section className="border-b border-slate-200/70 bg-surface-2/40 dark:border-slate-800/70">
          <div className="container-x py-10 sm:py-14">
            <span className="eyebrow">
              <Stethoscope className="h-3.5 w-3.5" /> Specialist Doctors
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Meet the specialists behind your care
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Credentialed consultants across Healtour's accredited hospital network. Search by name
              or filter by specialty and hospital — then let our AI match you to the right doctor.
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
                placeholder="Search doctors, e.g. “cardiologist” or a name"
                aria-label="Search doctors"
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex">
              <div className="min-w-[12rem]">
                <SearchableSelect
                  value={specialty}
                  onChange={setSpecialty}
                  options={specialtyOptions}
                  placeholder="All specialties"
                  searchPlaceholder="Search specialties…"
                />
              </div>
              <div className="min-w-[12rem]">
                <SearchableSelect
                  value={hospital}
                  onChange={setHospital}
                  options={hospitalOptions}
                  placeholder="All hospitals"
                  searchPlaceholder="Search hospitals…"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort doctors"
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
                {filtered.length} {filtered.length === 1 ? "doctor" : "doctors"}
                {specialty && <> in <span className="font-medium text-ink-soft">{specialty}</span></>}
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
              <p className="text-sm font-medium text-ink-soft">Couldn't load doctors.</p>
              <p className="mt-1 text-sm text-ink-muted">Please refresh the page and try again.</p>
            </div>
          ) : !all ? (
            <SectionSkeleton cards={8} />
          ) : (
            <>
              <DoctorGrid doctors={shown} />
              {visible < filtered.length && (
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="btn-secondary"
                  >
                    Load more doctors
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
