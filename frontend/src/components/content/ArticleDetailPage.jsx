import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, CalendarDays, User, Clock, Eye, ArrowLeft, Sparkles } from "lucide-react";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";
import SectionSkeleton from "../ui/SectionSkeleton";
import Seo from "../seo/Seo";
import { articleSchema, breadcrumbSchema } from "../../seo/schema";
import MediaImage from "./MediaImage";
import ArticleCard from "./ArticleCard";
import { gradientFor, sanitizeHtml, formatDate, readingMinutes } from "./contentMeta";
import {
  getBlogs,
  getBlogBySlug,
  getStories,
  getStoryBySlug,
} from "../../services/content";

const CONFIG = {
  blog: { getBySlug: getBlogBySlug, getAll: getBlogs, basePath: "/blog", assetDir: "blog-images", icon: "FileText", label: "Health Blog" },
  story: { getBySlug: getStoryBySlug, getAll: getStories, basePath: "/stories", assetDir: "story-images", icon: "Quote", label: "Patient Stories" },
};

const PROSE =
  "max-w-none text-[15px] leading-relaxed text-ink-muted [&_a]:text-brand-600 [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_img]:my-6 [&_img]:rounded-2xl [&_li]:mb-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6";

function NotFound({ basePath, label }) {
  return (
    <div className="container-x flex flex-col items-center py-32 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Article not found</h1>
      <p className="mt-2 text-sm text-ink-muted">This piece isn't available.</p>
      <Link to={basePath} className="btn-primary mt-6">Back to {label}</Link>
    </div>
  );
}

/** Generic detail page for blogs & patient stories. */
export default function ArticleDetailPage({ kind }) {
  const cfg = CONFIG[kind];
  const { slug } = useParams();
  const [article, setArticle] = useState(undefined); // undefined=loading, null=not found
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let alive = true;
    setArticle(undefined);
    setRelated([]);
    window.scrollTo({ top: 0 });
    cfg.getBySlug(slug)
      .then((a) => {
        if (!alive) return;
        setArticle(a || null);
      })
      .catch(() => alive && setArticle(null));
    return () => {
      alive = false;
    };
  }, [slug, kind]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!article) return;
    let alive = true;
    cfg.getAll().then((res) => {
      if (!alive) return;
      const others = res.items.filter((a) => a.slug !== article.slug);
      const sameCat = article.category ? others.filter((a) => a.category === article.category) : [];
      const pool = [...sameCat, ...others];
      const seen = new Set();
      const picks = [];
      for (const a of pool) {
        if (seen.has(a.slug)) continue;
        seen.add(a.slug);
        picks.push(a);
        if (picks.length === 3) break;
      }
      setRelated(picks);
    });
    return () => {
      alive = false;
    };
  }, [article]); // eslint-disable-line react-hooks/exhaustive-deps

  if (article === undefined) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <main className="container-x pt-32"><SectionSkeleton cards={3} /></main>
        <Footer />
      </div>
    );
  }
  if (article === null) {
    return (
      <div className="min-h-screen bg-canvas">
        <Seo title="Article not found" path={`${cfg.basePath}/${slug}`} noindex />
        <Navbar />
        <main className="pt-28 sm:pt-32"><NotFound basePath={cfg.basePath} label={cfg.label} /></main>
        <Footer />
      </div>
    );
  }

  const a = article;
  const html = sanitizeHtml(a.contentHtml);
  const src = a.photo ? `/uploads/${a.photo}` : null;

  const seoPath = `${cfg.basePath}/${a.slug}`;

  return (
    <div className="min-h-screen bg-canvas">
      <Seo
        title={a.metaTitle || a.title}
        description={a.metaDescription || a.excerpt}
        path={seoPath}
        type="article"
        jsonLd={[
          articleSchema(a, seoPath, { assetDir: cfg.assetDir }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: cfg.label, path: cfg.basePath },
            { name: a.title, path: seoPath },
          ]),
        ]}
      />
      <Navbar />
      <main className="pt-[4.25rem] sm:pt-[4.75rem] lg:pt-20">
        <article>
          {/* Header */}
          <header className="border-b border-slate-200/70 bg-surface-2/40 dark:border-slate-800/70">
            <div className="container-x py-10 sm:py-12">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
                <Link to="/" className="hover:text-ink-soft">Home</Link>
                <ChevronRight className="h-4 w-4" />
                <Link to={cfg.basePath} className="hover:text-ink-soft">{cfg.label}</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="line-clamp-1 text-ink-soft">{a.title}</span>
              </nav>

              {a.category && <span className="tag mt-5">{a.category}</span>}
              <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                {a.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-muted">
                {a.date && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-500" /> {formatDate(a.date)}</span>}
                {a.publisher && <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4 text-brand-500" /> {a.publisher}</span>}
                <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand-500" /> {readingMinutes(a.contentHtml)} min read</span>
                {typeof a.views === "number" && <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4 text-brand-500" /> {a.views.toLocaleString()} views</span>}
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="container-x py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <div className="aspect-[16/9] overflow-hidden rounded-3xl">
                <MediaImage src={src} alt={a.title} gradient={gradientFor(a.category || a.title)} icon={cfg.icon} label={a.category} />
              </div>
              {html ? (
                <div className={`mt-8 ${PROSE}`} dangerouslySetInnerHTML={{ __html: html }} />
              ) : (
                <p className="mt-8 text-[15px] leading-relaxed text-ink-muted">{a.excerpt}</p>
              )}

              {/* CTA */}
              <div className="mt-10 flex flex-col items-start gap-3 rounded-3xl bg-gradient-to-br from-brand-600 to-accent-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Planning treatment abroad?</p>
                  <p className="text-xs text-white/85">Get matched to the right hospital with a transparent cost estimate.</p>
                </div>
                <Link to="/chat" className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-white/90">
                  <Sparkles className="h-4 w-4" /> Plan with Healtour AI
                </Link>
              </div>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="border-t border-slate-200/70 bg-surface-2/40 py-14 dark:border-slate-800/70">
              <div className="container-x">
                <div className="flex items-end justify-between gap-4">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-ink">More to read</h2>
                  <Link to={cfg.basePath} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
                    View all <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((r) => (
                    <ArticleCard key={r.slug} article={r} basePath={cfg.basePath} assetDir={cfg.assetDir} icon={cfg.icon} />
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="container-x py-10">
            <Link to={cfg.basePath} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink-soft">
              <ArrowLeft className="h-4 w-4" /> Back to {cfg.label}
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
