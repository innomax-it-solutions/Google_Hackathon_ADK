import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, ArrowLeft, Sparkles, MessageCircle } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Icon from "../components/ui/Icon";
import SectionSkeleton from "../components/ui/SectionSkeleton";
import Seo from "../components/seo/Seo";
import { medicalSpecialtySchema, breadcrumbSchema } from "../seo/schema";
import TreatmentCard from "../components/treatments/TreatmentCard";
import DoctorCard from "../components/doctors/DoctorCard";
import HospitalCard from "../components/hospitals/HospitalCard";
import { deptIcon, deptGradient, sanitizeHtml } from "../components/treatments/treatmentMeta";
import {
  getDepartmentBySlug,
  getTreatments,
  getDoctors,
  getHospitals,
} from "../services/content";
import { whatsappLink } from "../data/shellData";

function SectionTitle({ children, to }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{children}</h2>
      {to && (
        <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-32 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Specialty not found</h1>
      <p className="mt-2 text-sm text-ink-muted">The specialty you're looking for isn't available.</p>
      <Link to="/specialties" className="btn-primary mt-6">Browse all specialties</Link>
    </div>
  );
}

export default function SpecialtyDetailPage() {
  const { slug } = useParams();
  const [dept, setDept] = useState(undefined); // undefined=loading, null=not found
  const [treatments, setTreatments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    let alive = true;
    setDept(undefined);
    setTreatments([]);
    setDoctors([]);
    setHospitals([]);
    window.scrollTo({ top: 0 });
    getDepartmentBySlug(slug)
      .then((d) => {
        if (!alive) return;
        setDept(d || null);
      })
      .catch(() => alive && setDept(null));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!dept) return;
    let alive = true;
    const name = dept.name;
    getTreatments().then((res) => alive && setTreatments(res.items.filter((t) => t.department === name)));
    getDoctors().then((res) => alive && setDoctors(res.items.filter((d) => (d.departments || []).includes(name))));
    getHospitals().then((res) => alive && setHospitals(res.items.filter((h) => (h.departments || []).includes(name))));
    return () => {
      alive = false;
    };
  }, [dept]);

  if (dept === undefined) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <main className="container-x pt-32"><SectionSkeleton cards={3} /></main>
        <Footer />
      </div>
    );
  }
  if (dept === null) {
    return (
      <div className="min-h-screen bg-canvas">
        <Seo title="Specialty not found" path={`/specialties/${slug}`} noindex />
        <Navbar />
        <main className="pt-28 sm:pt-32"><NotFound /></main>
        <Footer />
      </div>
    );
  }

  const d = dept;
  const bodyHtml = sanitizeHtml(d.descriptionHtml);
  const waMessage = `Hi Healtour, I'd like guidance on ${d.name} treatment options.`;
  const enc = encodeURIComponent(d.name);

  const seoPath = `/specialties/${d.slug}`;

  return (
    <div className="min-h-screen bg-canvas">
      <Seo
        title={d.metaTitle || d.name}
        description={d.metaDescription || d.description}
        path={seoPath}
        jsonLd={[
          medicalSpecialtySchema(d, seoPath),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Specialties", path: "/specialties" },
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
              <Link to="/specialties" className="hover:text-white">Specialties</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{d.name}</span>
            </nav>
            <div className="mt-6 flex items-start gap-4">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Icon name={deptIcon(d.name)} className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{d.name}</h1>
                {d.description && <p className="mt-2 max-w-3xl text-base leading-relaxed text-white/90">{d.description}</p>}
              </div>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/chat" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-white/90">
                <Sparkles className="h-4 w-4" /> Plan with Healtour AI
              </Link>
              <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
                <MessageCircle className="h-4 w-4" /> Ask about {d.name}
              </a>
            </div>
          </div>
        </section>

        <section className="container-x space-y-14 py-12 sm:py-16">
          {/* About (only when richer than the header description) */}
          {bodyHtml && sanitizeHtml(d.description) !== bodyHtml && (
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink">About {d.name}</h2>
              <div
                className="mt-5 max-w-none text-[15px] leading-relaxed text-ink-muted [&_a]:text-brand-600 [&_a]:underline [&_li]:mb-1.5 [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </div>
          )}

          {/* Treatments */}
          {treatments.length > 0 && (
            <div>
              <SectionTitle to={`/treatments?specialty=${enc}`}>Treatments in {d.name}</SectionTitle>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {treatments.slice(0, 6).map((t) => <TreatmentCard key={t.slug} treatment={t} />)}
              </div>
            </div>
          )}

          {/* Doctors */}
          {doctors.length > 0 && (
            <div>
              <SectionTitle to={`/doctors?specialty=${enc}`}>{d.name} specialists</SectionTitle>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {doctors.slice(0, 4).map((doc) => <DoctorCard key={doc.slug} doctor={doc} />)}
              </div>
            </div>
          )}

          {/* Hospitals */}
          {hospitals.length > 0 && (
            <div>
              <SectionTitle to="/hospitals">Hospitals offering {d.name}</SectionTitle>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {hospitals.slice(0, 3).map((h) => <HospitalCard key={h.slug} hospital={h} />)}
              </div>
            </div>
          )}

          <div>
            <Link to="/specialties" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink-soft">
              <ArrowLeft className="h-4 w-4" /> Back to all specialties
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
