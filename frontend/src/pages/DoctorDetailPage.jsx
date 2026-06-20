import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  Building2,
  MapPin,
  Clock,
  Stethoscope,
  Award,
  Sparkles,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SectionSkeleton from "../components/ui/SectionSkeleton";
import Seo from "../components/seo/Seo";
import { physicianSchema, breadcrumbSchema } from "../seo/schema";
import TreatmentCard from "../components/treatments/TreatmentCard";
import DoctorCard from "../components/doctors/DoctorCard";
import { docInitials, deptGradient, sanitizeHtml } from "../components/doctors/doctorMeta";
import { getDoctorBySlug, getDoctors, getTreatments } from "../services/content";
import { whatsappLink } from "../data/shellData";

const TREATMENT_LIMIT = 6;
const RELATED_LIMIT = 4;

const PROSE =
  "max-w-none text-[15px] leading-relaxed text-ink-muted [&_a]:text-brand-600 [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mb-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6";

function SectionTitle({ children }) {
  return <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{children}</h2>;
}

function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-32 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Doctor not found</h1>
      <p className="mt-2 text-sm text-ink-muted">The profile you're looking for isn't available.</p>
      <Link to="/doctors" className="btn-primary mt-6">Browse all doctors</Link>
    </div>
  );
}

export default function DoctorDetailPage() {
  const { slug } = useParams();
  const [doctor, setDoctor] = useState(undefined); // undefined=loading, null=not found
  const [treatments, setTreatments] = useState([]);
  const [related, setRelated] = useState([]);
  const [photoOk, setPhotoOk] = useState(true);

  useEffect(() => {
    let alive = true;
    setDoctor(undefined);
    setTreatments([]);
    setRelated([]);
    setPhotoOk(true);
    window.scrollTo({ top: 0 });

    getDoctorBySlug(slug)
      .then((d) => {
        if (!alive) return;
        setDoctor(d || null);
      })
      .catch(() => alive && setDoctor(null));

    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!doctor) return;
    let alive = true;

    const wanted = new Set(doctor.treatmentSlugs || []);
    if (wanted.size) {
      getTreatments().then((res) => {
        if (alive) setTreatments(res.items.filter((t) => wanted.has(t.slug)));
      });
    }

    getDoctors().then((res) => {
      if (!alive) return;
      const others = res.items.filter((d) => d.slug !== doctor.slug);
      const dep = doctor.departments?.[0];
      const sameHospital = doctor.hospitalSlug
        ? others.filter((d) => d.hospitalSlug === doctor.hospitalSlug)
        : [];
      const sameDept = dep ? others.filter((d) => (d.departments || []).includes(dep)) : [];
      const pool = [...sameHospital, ...sameDept, ...others];
      const seen = new Set();
      const picks = [];
      for (const d of pool) {
        if (seen.has(d.slug)) continue;
        seen.add(d.slug);
        picks.push(d);
        if (picks.length === RELATED_LIMIT) break;
      }
      setRelated(picks);
    });

    return () => {
      alive = false;
    };
  }, [doctor]);

  if (doctor === undefined) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <main className="container-x pt-32"><SectionSkeleton cards={3} /></main>
        <Footer />
      </div>
    );
  }

  if (doctor === null) {
    return (
      <div className="min-h-screen bg-canvas">
        <Seo title="Doctor not found" path={`/doctors/${slug}`} noindex />
        <Navbar />
        <main className="pt-28 sm:pt-32"><NotFound /></main>
        <Footer />
      </div>
    );
  }

  const d = doctor;
  const photo = d.photo ? `/uploads/${d.photo}` : null;
  const bioHtml = sanitizeHtml(d.bioHtml);
  const interestsHtml = sanitizeHtml(d.interests);
  const departments = d.departments || [];
  const waMessage = `Hi Healtour, I'd like to consult ${d.name}${d.hospital ? ` at ${d.hospital}` : ""}.`;
  const shownTreatments = treatments.slice(0, TREATMENT_LIMIT);

  const facts = [
    d.experience && { icon: Clock, label: "Experience", value: d.experience },
    d.hospital && { icon: Building2, label: "Hospital", value: d.hospital, to: d.hospitalSlug ? `/hospitals/${d.hospitalSlug}` : null },
    d.city && { icon: MapPin, label: "Location", value: [d.city, d.country].filter(Boolean).join(", ") },
    departments.length && { icon: Stethoscope, label: "Specialties", value: departments.join(", ") },
  ].filter(Boolean);

  const seoPath = `/doctors/${d.slug}`;

  return (
    <div className="min-h-screen bg-canvas">
      <Seo
        title={d.metaTitle || d.name}
        description={d.metaDescription || d.designation || `${d.name} — specialist at ${d.hospital || "Healtour's network"}.`}
        path={seoPath}
        type="profile"
        jsonLd={[
          physicianSchema(d, seoPath),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Doctors", path: "/doctors" },
            { name: d.name, path: seoPath },
          ]),
        ]}
      />
      <Navbar />

      <main className="pt-[4.25rem] sm:pt-[4.75rem] lg:pt-20">
        {/* Header */}
        <section className={`relative overflow-hidden bg-gradient-to-br ${deptGradient(d.name)}`}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="container-x relative py-10 text-white sm:py-14">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-white/80">
              <Link to="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/doctors" className="hover:text-white">Doctors</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{d.name}</span>
            </nav>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white/20 font-display text-2xl font-extrabold backdrop-blur-sm">
                {photo && photoOk ? (
                  <img
                    src={photo}
                    alt={d.name}
                    loading="lazy"
                    onError={() => setPhotoOk(false)}
                    className="h-full w-full rounded-3xl object-cover"
                  />
                ) : (
                  docInitials(d.name)
                )}
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{d.name}</h1>
                {d.designation && <p className="mt-1 text-base text-white/90">{d.designation}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                  {d.experience && (
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {d.experience}</span>
                  )}
                  {d.hospital && (
                    <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {d.hospital}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/chat" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-white/90">
                <Sparkles className="h-4 w-4" /> Plan with Healtour AI
              </Link>
              <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
                <MessageCircle className="h-4 w-4" /> Request a consultation
              </a>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="container-x py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
            <div className="min-w-0 space-y-12">
              {/* About */}
              {(bioHtml || d.bio) && (
                <div>
                  <SectionTitle>About {d.name}</SectionTitle>
                  <div className="mt-5">
                    {bioHtml ? (
                      <div className={PROSE} dangerouslySetInnerHTML={{ __html: bioHtml }} />
                    ) : (
                      <p className="text-[15px] leading-relaxed text-ink-muted">{d.bio}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Areas of interest */}
              {interestsHtml && (
                <div>
                  <SectionTitle>Areas of interest</SectionTitle>
                  <div className={`mt-5 ${PROSE}`} dangerouslySetInnerHTML={{ __html: interestsHtml }} />
                </div>
              )}

              {/* Career highlights */}
              {d.careerHighlights && d.careerHighlights.trim() && (
                <div>
                  <SectionTitle>Career highlights</SectionTitle>
                  <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-ink-muted">
                    {d.careerHighlights}
                  </p>
                </div>
              )}

              {/* Awards */}
              {d.awards && d.awards.trim() && (
                <div>
                  <SectionTitle>Awards &amp; recognition</SectionTitle>
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-surface-2/40 p-5 dark:border-white/[0.07]">
                    <Award className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500" />
                    <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-muted">{d.awards}</p>
                  </div>
                </div>
              )}

              {/* Treatments */}
              {shownTreatments.length > 0 && (
                <div>
                  <SectionTitle>Treatments &amp; procedures</SectionTitle>
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
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">At a glance</h2>
                <ul className="mt-4 space-y-4">
                  {facts.map((f) => (
                    <li key={f.label} className="flex items-start gap-3">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                        <f.icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-ink-muted">{f.label}</p>
                        {f.to ? (
                          <Link to={f.to} className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
                            {f.value}
                          </Link>
                        ) : (
                          <p className="text-sm font-semibold text-ink">{f.value}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card bg-gradient-to-br from-brand-600 to-accent-600 p-6 text-white">
                <p className="text-sm font-semibold">Want to consult {d.name.split(" ").slice(0, 2).join(" ")}?</p>
                <p className="mt-1 text-xs text-white/85">
                  Healtour arranges consultations, second opinions and a full treatment plan.
                </p>
                <Link to="/chat" className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-white/90">
                  <Sparkles className="h-4 w-4" /> Start with AI
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
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Related specialists</h2>
                <Link to="/doctors" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((rd) => (
                  <DoctorCard key={rd.slug} doctor={rd} />
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="container-x py-10">
          <Link to="/doctors" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink-soft">
            <ArrowLeft className="h-4 w-4" /> Back to all doctors
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
