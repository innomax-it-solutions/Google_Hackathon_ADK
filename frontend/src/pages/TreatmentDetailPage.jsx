import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  Clock,
  BedDouble,
  Stethoscope,
  Sparkles,
  MessageCircle,
  CircleDollarSign,
  ArrowLeft,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Icon from "../components/ui/Icon";
import SectionSkeleton from "../components/ui/SectionSkeleton";
import Seo from "../components/seo/Seo";
import { medicalProcedureSchema, breadcrumbSchema } from "../seo/schema";
import MediaImage from "../components/content/MediaImage";
import TreatmentCard from "../components/treatments/TreatmentCard";
import TreatmentFaq from "../components/treatments/TreatmentFaq";
import {
  deptIcon,
  deptGradient,
  durationLabel,
  stayLabel,
  buildFaqs,
  sanitizeHtml,
} from "../components/treatments/treatmentMeta";
import { getTreatmentBySlug, getTreatments } from "../services/content";
import { whatsappLink } from "../data/shellData";

function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-32 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Treatment not found</h1>
      <p className="mt-2 text-sm text-ink-muted">
        The treatment you're looking for isn't available.
      </p>
      <Link to="/treatments" className="btn-primary mt-6">
        Browse all treatments
      </Link>
    </div>
  );
}

export default function TreatmentDetailPage() {
  const { slug } = useParams();
  const [treatment, setTreatment] = useState(undefined); // undefined = loading, null = not found
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let alive = true;
    setTreatment(undefined);
    setRelated([]);
    window.scrollTo({ top: 0 });

    getTreatmentBySlug(slug)
      .then((t) => {
        if (!alive) return;
        setTreatment(t || null);
      })
      .catch(() => alive && setTreatment(null));

    return () => {
      alive = false;
    };
  }, [slug]);

  // Related treatments: same specialty first, then top-up with others.
  useEffect(() => {
    if (!treatment) return;
    let alive = true;
    getTreatments().then((res) => {
      if (!alive) return;
      const others = res.items.filter((t) => t.slug !== treatment.slug);
      const sameDept = treatment.department
        ? others.filter((t) => t.department === treatment.department)
        : [];
      const pool = sameDept.length >= 3 ? sameDept : [...sameDept, ...others];
      const seen = new Set();
      const picks = [];
      for (const t of pool) {
        if (seen.has(t.slug)) continue;
        seen.add(t.slug);
        picks.push(t);
        if (picks.length === 3) break;
      }
      setRelated(picks);
    });
    return () => {
      alive = false;
    };
  }, [treatment]);

  if (treatment === undefined) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <main className="container-x pt-32">
          <SectionSkeleton cards={3} />
        </main>
        <Footer />
      </div>
    );
  }

  if (treatment === null) {
    return (
      <div className="min-h-screen bg-canvas">
        <Seo title="Treatment not found" path={`/treatments/${slug}`} noindex />
        <Navbar />
        <main className="pt-28 sm:pt-32">
          <NotFound />
        </main>
        <Footer />
      </div>
    );
  }

  const t = treatment;
  const photo = t.photo ? `/uploads/${t.photo}` : null;
  const duration = durationLabel(t);
  const stay = stayLabel(t);
  const faqs = buildFaqs(t);
  const bodyHtml = sanitizeHtml(t.descriptionHtml);
  const waMessage = `Hi Healtour, I'd like a cost estimate for ${t.name}.`;

  const facts = [
    t.department && { icon: Stethoscope, label: "Specialty", value: t.department },
    duration && { icon: Clock, label: "Procedure time", value: duration },
    stay && { icon: BedDouble, label: "Hospital stay", value: `${t.days} days (indicative)` },
    { icon: CircleDollarSign, label: "Cost", value: "Estimate on request" },
  ].filter(Boolean);

  const seoPath = `/treatments/${t.slug}`;

  return (
    <div className="min-h-screen bg-canvas">
      <Seo
        title={t.metaTitle || t.name}
        description={t.metaDescription || t.shortDescription}
        path={seoPath}
        type="article"
        jsonLd={[
          medicalProcedureSchema(t, seoPath),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Treatments", path: "/treatments" },
            { name: t.name, path: seoPath },
          ]),
        ]}
      />
      <Navbar />

      <main className="pt-[4.25rem] sm:pt-[4.75rem] lg:pt-20">
        {/* Header */}
        <section className={`relative overflow-hidden bg-gradient-to-br ${deptGradient(t.department)}`}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="container-x relative py-10 text-white sm:py-14">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-white/80">
              <Link to="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/treatments" className="hover:text-white">Treatments</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{t.name}</span>
            </nav>

            <div className="mt-6 flex items-start gap-4">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Icon name={deptIcon(t.department)} className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                {t.department && (
                  <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    {t.department}
                  </span>
                )}
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {t.name}
                </h1>
              </div>
            </div>

            {t.shortDescription && (
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/90">
                {t.shortDescription}
              </p>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/chat" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-white/90">
                <Sparkles className="h-4 w-4" /> Plan with Healtour AI
              </Link>
              <a
                href={whatsappLink(waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <MessageCircle className="h-4 w-4" /> Get a cost estimate
              </a>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="container-x py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
            {/* Main */}
            <div className="min-w-0">
              {photo && (
                <div className="mb-8 aspect-[16/9] overflow-hidden rounded-3xl">
                  <MediaImage src={photo} alt={t.name} gradient={deptGradient(t.department)} icon={deptIcon(t.department)} label={t.name} />
                </div>
              )}
              {bodyHtml ? (
                <div
                  className="max-w-none text-[15px] leading-relaxed text-ink-muted [&_a]:text-brand-600 [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mb-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              ) : (
                <p className="text-[15px] leading-relaxed text-ink-muted">{t.description}</p>
              )}

              {/* FAQ */}
              {faqs.length > 0 && (
                <div className="mt-12">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                    Frequently asked questions
                  </h2>
                  <div className="mt-5">
                    <TreatmentFaq faqs={faqs} />
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="card p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
                  Key facts
                </h2>
                <ul className="mt-4 space-y-4">
                  {facts.map((f) => (
                    <li key={f.label} className="flex items-start gap-3">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                        <f.icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-ink-muted">{f.label}</p>
                        <p className="text-sm font-semibold text-ink">{f.value}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 p-5 text-white">
                  <p className="text-sm font-semibold">Want a personalised plan?</p>
                  <p className="mt-1 text-xs text-white/85">
                    Healtour matches you to the right hospital and estimates your costs in minutes.
                  </p>
                  <Link
                    to="/chat"
                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-white/90"
                  >
                    <Sparkles className="h-4 w-4" /> Start with AI
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-slate-200/70 bg-surface-2/40 py-14 dark:border-slate-800/70">
            <div className="container-x">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                  Related treatments
                </h2>
                <Link
                  to="/treatments"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
                >
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((rt) => (
                  <TreatmentCard key={rt.slug} treatment={rt} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Back link */}
        <div className="container-x py-10">
          <Link
            to="/treatments"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all treatments
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
