import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Globe,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Icon from "../components/ui/Icon";
import SectionSkeleton from "../components/ui/SectionSkeleton";
import Seo from "../components/seo/Seo";
import { hospitalSchema, breadcrumbSchema } from "../seo/schema";
import TreatmentCard from "../components/treatments/TreatmentCard";
import DoctorCard from "../components/doctors/DoctorCard";
import HospitalGallery from "../components/hospitals/HospitalGallery";
import {
  initials,
  deptIcon,
  deptGradient,
  sanitizeHtml,
  shortLocation,
  fullLocation,
  mapEmbedUrl,
  isAccredited,
  hospitalStats,
} from "../components/hospitals/hospitalMeta";
import {
  getHospitalBySlug,
  getDoctors,
  getTreatments,
} from "../services/content";
import { whatsappLink } from "../data/shellData";

const DOCTOR_LIMIT = 8;
const TREATMENT_LIMIT = 6;

function SectionTitle({ children, action }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{children}</h2>
      {action}
    </div>
  );
}

function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-32 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Hospital not found</h1>
      <p className="mt-2 text-sm text-ink-muted">
        The hospital you're looking for isn't available.
      </p>
      <Link to="/hospitals" className="btn-primary mt-6">Browse all hospitals</Link>
    </div>
  );
}

export default function HospitalDetailPage() {
  const { slug } = useParams();
  const [hospital, setHospital] = useState(undefined); // undefined=loading, null=not found
  const [doctors, setDoctors] = useState([]);
  const [treatments, setTreatments] = useState([]);

  useEffect(() => {
    let alive = true;
    setHospital(undefined);
    setDoctors([]);
    setTreatments([]);
    window.scrollTo({ top: 0 });

    getHospitalBySlug(slug)
      .then((h) => {
        if (!alive) return;
        setHospital(h || null);
      })
      .catch(() => alive && setHospital(null));

    return () => {
      alive = false;
    };
  }, [slug]);

  // Related entities once the hospital resolves.
  useEffect(() => {
    if (!hospital) return;
    let alive = true;

    getDoctors().then((res) => {
      if (!alive) return;
      setDoctors(res.items.filter((d) => d.hospitalSlug === hospital.slug));
    });

    const wanted = new Set(hospital.treatmentSlugs || []);
    if (wanted.size) {
      getTreatments().then((res) => {
        if (!alive) return;
        setTreatments(res.items.filter((t) => wanted.has(t.slug)));
      });
    }

    return () => {
      alive = false;
    };
  }, [hospital]);

  if (hospital === undefined) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <main className="container-x pt-32"><SectionSkeleton cards={3} /></main>
        <Footer />
      </div>
    );
  }

  if (hospital === null) {
    return (
      <div className="min-h-screen bg-canvas">
        <Seo title="Hospital not found" path={`/hospitals/${slug}`} noindex />
        <Navbar />
        <main className="pt-28 sm:pt-32"><NotFound /></main>
        <Footer />
      </div>
    );
  }

  const h = hospital;
  const bodyHtml = sanitizeHtml(h.descriptionHtml);
  const depts = h.departments || [];
  const stats = hospitalStats(h);
  const waMessage = `Hi Healtour, I'd like information about treatment at ${h.name}.`;
  const shownDoctors = doctors.slice(0, DOCTOR_LIMIT);
  const shownTreatments = treatments.slice(0, TREATMENT_LIMIT);

  const seoPath = `/hospitals/${h.slug}`;

  return (
    <div className="min-h-screen bg-canvas">
      <Seo
        title={h.metaTitle || h.name}
        description={h.metaDescription || h.description}
        path={seoPath}
        jsonLd={[
          hospitalSchema(h, seoPath),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Hospitals", path: "/hospitals" },
            { name: h.name, path: seoPath },
          ]),
        ]}
      />
      <Navbar />

      <main className="pt-[4.25rem] sm:pt-[4.75rem] lg:pt-20">
        {/* Header */}
        <section className={`relative overflow-hidden bg-gradient-to-br ${deptGradient(h.name)}`}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="container-x relative py-10 text-white sm:py-14">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-white/80">
              <Link to="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/hospitals" className="hover:text-white">Hospitals</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{h.name}</span>
            </nav>

            <div className="mt-6 flex items-start gap-4">
              <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 font-display text-xl font-extrabold backdrop-blur-sm">
                {initials(h.name)}
              </span>
              <div className="min-w-0">
                {isAccredited(h) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    <ShieldCheck className="h-3.5 w-3.5" /> Accredited
                  </span>
                )}
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{h.name}</h1>
                {shortLocation(h) && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/90">
                    <MapPin className="h-4 w-4" /> {shortLocation(h)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/chat" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-white/90">
                <Sparkles className="h-4 w-4" /> Plan with Healtour AI
              </Link>
              <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
                <MessageCircle className="h-4 w-4" /> Enquire on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="container-x py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
            <div className="min-w-0 space-y-14">
              {/* About */}
              <div>
                <SectionTitle>About {h.name}</SectionTitle>
                <div className="mt-5">
                  {bodyHtml ? (
                    <div
                      className="max-w-none text-[15px] leading-relaxed text-ink-muted [&_a]:text-brand-600 [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mb-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  ) : (
                    <p className="text-[15px] leading-relaxed text-ink-muted">{h.description}</p>
                  )}
                </div>
              </div>

              {/* Gallery */}
              <div>
                <SectionTitle>Gallery</SectionTitle>
                <div className="mt-5">
                  <HospitalGallery hospital={h} />
                </div>
              </div>

              {/* Departments */}
              {depts.length > 0 && (
                <div>
                  <SectionTitle>Departments &amp; specialties</SectionTitle>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {depts.map((d) => (
                      <div key={d} className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white p-3 dark:border-white/[0.07] dark:bg-slate-900">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                          <Icon name={deptIcon(d)} className="h-[18px] w-[18px]" />
                        </span>
                        <span className="text-sm font-medium text-ink-soft">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctors */}
              <div>
                <SectionTitle>Doctors</SectionTitle>
                {shownDoctors.length > 0 ? (
                  <>
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {shownDoctors.map((d) => (
                        <DoctorCard key={d.slug || d.id} doctor={d} />
                      ))}
                    </div>
                    {doctors.length > DOCTOR_LIMIT && (
                      <p className="mt-4 text-sm text-ink-muted">
                        Showing {DOCTOR_LIMIT} of {doctors.length} listed specialists.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-5 rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-ink-muted dark:border-white/10">
                    {h.numberOfDoctors
                      ? `This hospital has ${h.numberOfDoctors}+ specialists. Detailed profiles are being added — ask Healtour AI to match you with the right doctor.`
                      : "Specialist profiles for this hospital are being added."}
                  </p>
                )}
              </div>

              {/* Treatments */}
              {shownTreatments.length > 0 && (
                <div>
                  <SectionTitle
                    action={
                      <Link to="/treatments" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
                        All treatments <ChevronRight className="h-4 w-4" />
                      </Link>
                    }
                  >
                    Treatments offered
                  </SectionTitle>
                  <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {shownTreatments.map((t) => (
                      <TreatmentCard key={t.slug} treatment={t} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
              <div className="card p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Quick facts</h2>
                <ul className="mt-4 grid grid-cols-2 gap-4">
                  {stats.map((s) => (
                    <li key={s.label}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                        <Icon name={s.icon} className="h-[18px] w-[18px]" />
                      </span>
                      <p className="mt-2 font-display text-lg font-bold text-ink">{s.value}</p>
                      <p className="text-xs text-ink-muted">{s.label}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Location & contact */}
              <div className="card overflow-hidden">
                <div className="p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Location &amp; contact</h2>
                  {fullLocation(h) && (
                    <p className="mt-3 flex items-start gap-2.5 text-sm text-ink-soft">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" /> {fullLocation(h)}
                    </p>
                  )}
                  <ul className="mt-3 space-y-2.5 text-sm">
                    {h.phone && (
                      <li className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 flex-shrink-0 text-brand-500" />
                        <a href={`tel:${h.phone}`} className="text-ink-soft hover:text-brand-700 dark:hover:text-brand-300">{h.phone}</a>
                      </li>
                    )}
                    {h.email && (
                      <li className="flex items-center gap-2.5">
                        <Mail className="h-4 w-4 flex-shrink-0 text-brand-500" />
                        <a href={`mailto:${h.email}`} className="break-all text-ink-soft hover:text-brand-700 dark:hover:text-brand-300">{h.email}</a>
                      </li>
                    )}
                    {h.website && (
                      <li className="flex items-center gap-2.5">
                        <Globe className="h-4 w-4 flex-shrink-0 text-brand-500" />
                        <a href={h.website} target="_blank" rel="noopener noreferrer" className="break-all text-ink-soft hover:text-brand-700 dark:hover:text-brand-300">
                          Visit website
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
                <iframe
                  title={`Map of ${h.name}`}
                  src={mapEmbedUrl(h)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-56 w-full border-0"
                />
              </div>

              <div className="card bg-gradient-to-br from-brand-600 to-accent-600 p-6 text-white">
                <p className="text-sm font-semibold">Considering this hospital?</p>
                <p className="mt-1 text-xs text-white/85">
                  Get a personalised treatment plan and transparent cost estimate in minutes.
                </p>
                <Link to="/chat" className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-white/90">
                  <Sparkles className="h-4 w-4" /> Start with AI
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <div className="container-x pb-12">
          <Link to="/hospitals" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink-soft">
            <ArrowLeft className="h-4 w-4" /> Back to all hospitals
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
