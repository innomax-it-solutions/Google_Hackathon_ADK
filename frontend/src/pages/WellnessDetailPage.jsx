import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, MapPin, Check, MessageCircle, Sparkles, ArrowLeft } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SectionSkeleton from "../components/ui/SectionSkeleton";
import Seo from "../components/seo/Seo";
import { wellnessSchema, breadcrumbSchema } from "../seo/schema";
import MediaImage from "../components/content/MediaImage";
import WellnessCard from "../components/wellness/WellnessCard";
import { gradientFor, sanitizeHtml, priceInfo } from "../components/wellness/wellnessMeta";
import { getWellness, getWellnessBySlug } from "../services/content";
import { whatsappLink } from "../data/shellData";

const PROSE =
  "max-w-none text-[15px] leading-relaxed text-ink-muted [&_a]:text-brand-600 [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mb-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6";

function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-32 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Package not found</h1>
      <p className="mt-2 text-sm text-ink-muted">This wellness package isn't available.</p>
      <Link to="/wellness" className="btn-primary mt-6">Browse all packages</Link>
    </div>
  );
}

export default function WellnessDetailPage() {
  const { slug } = useParams();
  const [pkg, setPkg] = useState(undefined); // undefined=loading, null=not found
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let alive = true;
    setPkg(undefined);
    setRelated([]);
    window.scrollTo({ top: 0 });
    getWellnessBySlug(slug)
      .then((w) => {
        if (!alive) return;
        setPkg(w || null);
      })
      .catch(() => alive && setPkg(null));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!pkg) return;
    let alive = true;
    getWellness().then((res) => {
      if (alive) setRelated(res.items.filter((w) => w.slug !== pkg.slug).slice(0, 3));
    });
    return () => {
      alive = false;
    };
  }, [pkg]);

  if (pkg === undefined) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <main className="container-x pt-32"><SectionSkeleton cards={3} /></main>
        <Footer />
      </div>
    );
  }
  if (pkg === null) {
    return (
      <div className="min-h-screen bg-canvas">
        <Seo title="Package not found" path={`/wellness/${slug}`} noindex />
        <Navbar />
        <main className="pt-28 sm:pt-32"><NotFound /></main>
        <Footer />
      </div>
    );
  }

  const w = pkg;
  const html = sanitizeHtml(w.descriptionHtml);
  const price = priceInfo(w);
  const benefits = Array.isArray(w.benefits) ? w.benefits.filter(Boolean) : [];
  const gradient = gradientFor(w.name);
  const photo = w.photo ? `/wellness-images/${w.photo}` : null;
  const thumb = w.thumbnail ? `/wellness-images/${w.thumbnail}` : null;
  const waMessage = `Hi Healtour, I'd like to book the "${w.name}" wellness package.`;

  const seoPath = `/wellness/${w.slug}`;

  return (
    <div className="min-h-screen bg-canvas">
      <Seo
        title={w.metaTitle || w.name}
        description={w.metaDescription || w.shortDescription}
        path={seoPath}
        jsonLd={[
          wellnessSchema(w, seoPath, price),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Wellness", path: "/wellness" },
            { name: w.name, path: seoPath },
          ]),
        ]}
      />
      <Navbar />
      <main className="pt-[4.25rem] sm:pt-[4.75rem] lg:pt-20">
        {/* Header */}
        <section className={`relative overflow-hidden bg-gradient-to-br ${gradient}`}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="container-x relative py-10 text-white sm:py-14">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-white/80">
              <Link to="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/wellness" className="hover:text-white">Wellness</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{w.name}</span>
            </nav>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {w.isNew && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">New</span>}
              {price?.discount > 0 && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">{price.discount}% off</span>}
            </div>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">{w.name}</h1>
            {w.shortDescription && <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/90">{w.shortDescription}</p>}
            {w.location && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-white/90"><MapPin className="h-4 w-4" /> {w.location}</p>
            )}
          </div>
        </section>

        {/* Body */}
        <section className="container-x py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
            <div className="min-w-0 space-y-12">
              {/* Gallery */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 aspect-[16/9] overflow-hidden rounded-2xl sm:col-span-1">
                  <MediaImage src={photo} alt={w.name} gradient={gradient} icon="Leaf" label={w.name} />
                </div>
                <div className="col-span-2 aspect-[16/9] overflow-hidden rounded-2xl sm:col-span-1">
                  <MediaImage src={thumb || photo} alt={w.name} gradient={gradient} icon="Sparkles" label={w.location || w.name} />
                </div>
              </div>

              {/* About */}
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">About this package</h2>
                {html ? (
                  <div className={`mt-5 ${PROSE}`} dangerouslySetInnerHTML={{ __html: html }} />
                ) : (
                  <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">{w.description}</p>
                )}
              </div>

              {/* Benefits */}
              {benefits.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Benefits</h2>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-white/[0.07] dark:bg-slate-900">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-sm leading-relaxed text-ink-muted">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="card p-6">
                {price && (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-ink">{price.finalLabel}</span>
                    {price.discount > 0 && <span className="text-sm text-ink-muted line-through">{price.originalLabel}</span>}
                  </div>
                )}
                {price?.discount > 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Save {price.discount}% — limited period
                  </p>
                )}
                {w.location && (
                  <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                    <MapPin className="h-4 w-4 text-brand-500" /> {w.location}
                  </p>
                )}

                <a
                  href={whatsappLink(waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  <MessageCircle className="h-4 w-4" /> Book on WhatsApp
                </a>
                <Link to="/chat" className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-700 dark:border-white/10 dark:hover:text-brand-300">
                  <Sparkles className="h-4 w-4" /> Ask Healtour AI
                </Link>
              </div>
            </aside>
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-slate-200/70 bg-surface-2/40 py-14 dark:border-slate-800/70">
            <div className="container-x">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">More wellness packages</h2>
                <Link to="/wellness" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => <WellnessCard key={r.slug} pkg={r} />)}
              </div>
            </div>
          </section>
        )}

        <div className="container-x py-10">
          <Link to="/wellness" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink-soft">
            <ArrowLeft className="h-4 w-4" /> Back to all packages
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
