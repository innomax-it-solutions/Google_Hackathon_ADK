import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";
import SearchableSelect from "../ui/SearchableSelect";
import SectionSkeleton from "../ui/SectionSkeleton";
import Icon from "../ui/Icon";
import Seo from "../seo/Seo";
import { breadcrumbSchema } from "../../seo/schema";
import ArticleGrid from "./ArticleGrid";
import { getBlogs, getStories } from "../../services/content";

export const ARTICLE_CONFIG = {
  blog: {
    getAll: getBlogs,
    basePath: "/blog",
    assetDir: "blog-images",
    icon: "FileText",
    eyebrow: "Health Blog",
    title: "Insights for your medical journey",
    intro: "Expert articles on treatments, recovery and planning care abroad — written to help you make confident, informed decisions.",
  },
  story: {
    getAll: getStories,
    basePath: "/stories",
    assetDir: "story-images",
    icon: "Quote",
    eyebrow: "Patient Stories",
    title: "Real journeys, real outcomes",
    intro: "Stories from patients who planned and completed their treatment with Healtour — from first enquiry to recovery.",
  },
};

/** Generic listing page for blogs & patient stories (shared schema). */
export default function ArticleListPage({ kind }) {
  const cfg = ARTICLE_CONFIG[kind];
  const [params] = useSearchParams();
  const [all, setAll] = useState(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");

  useEffect(() => {
    let alive = true;
    cfg.getAll()
      .then((res) => alive && setAll(res.items))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryOptions = useMemo(() => {
    if (!all) return [];
    const counts = new Map();
    for (const a of all) if (a.category) counts.set(a.category, (counts.get(a.category) || 0) + 1);
    const opts = [...counts.entries()]
      .sort((x, y) => x[0].localeCompare(y[0]))
      .map(([name, n]) => ({ value: name, label: `${name} (${n})` }));
    return [{ value: "", label: "All categories" }, ...opts];
  }, [all]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = search.trim().toLowerCase();
    return all.filter((a) => {
      if (category && a.category !== category) return false;
      if (!q) return true;
      return [a.title, a.excerpt, a.category, a.publisher]
        .some((f) => String(f ?? "").toLowerCase().includes(q));
    });
  }, [all, search, category]);

  const hasFilters = search.trim() || category;

  return (
    <div className="min-h-screen bg-canvas">
      <Seo
        title={cfg.eyebrow}
        description={cfg.intro}
        path={cfg.basePath}
        jsonLd={breadcrumbSchema([{ name: "Home", path: "/" }, { name: cfg.eyebrow, path: cfg.basePath }])}
      />
      <Navbar />
      <main className="pt-28 sm:pt-32">
        <section className="border-b border-slate-200/70 bg-surface-2/40 dark:border-slate-800/70">
          <div className="container-x py-10 sm:py-14">
            <span className="eyebrow"><Icon name={cfg.icon} className="h-3.5 w-3.5" /> {cfg.eyebrow}</span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{cfg.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">{cfg.intro}</p>
          </div>
        </section>

        <section className="container-x py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${cfg.eyebrow.toLowerCase()}…`}
                aria-label={`Search ${cfg.eyebrow}`}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-10 text-[14px] text-ink transition-colors placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="min-w-[14rem]">
              <SearchableSelect
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                placeholder="All categories"
                searchPlaceholder="Search categories…"
              />
            </div>
          </div>

          {all && (
            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-sm text-ink-muted">
                {filtered.length} {filtered.length === 1 ? "article" : "articles"}
                {category && <> in <span className="font-medium text-ink-soft">{category}</span></>}
              </p>
              {hasFilters && (
                <button type="button" onClick={() => { setSearch(""); setCategory(""); }} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300">
                  <X className="h-3.5 w-3.5" /> Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        <section className="container-x pb-20">
          {error ? (
            <div className="rounded-3xl border border-dashed border-slate-200 py-20 text-center dark:border-white/10">
              <p className="text-sm font-medium text-ink-soft">Couldn't load content.</p>
              <p className="mt-1 text-sm text-ink-muted">Please refresh the page and try again.</p>
            </div>
          ) : !all ? (
            <SectionSkeleton cards={6} />
          ) : (
            <ArticleGrid articles={filtered} basePath={cfg.basePath} assetDir={cfg.assetDir} icon={cfg.icon} />
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
