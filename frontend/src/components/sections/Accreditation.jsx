import { ShieldCheck, Award, BadgeCheck } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";

/**
 * Accreditation — highlights the quality standards Healtour's partner network
 * is held to. Badge tiles are typographic (monogram + standard) so no external
 * logo assets are required; drop in real logo images later if desired.
 */
const ACCREDITATIONS = [
  {
    mark: "JCI",
    name: "Joint Commission International",
    description: "The global gold standard for hospital quality and patient safety.",
  },
  {
    mark: "NABH",
    name: "National Accreditation Board for Hospitals",
    description: "India's apex accreditation for healthcare quality standards.",
  },
  {
    mark: "NABL",
    name: "National Accreditation Board for Laboratories",
    description: "Certified diagnostic and pathology lab accuracy.",
  },
  {
    mark: "ISO",
    name: "ISO 9001 Certified",
    description: "Internationally recognised quality-management systems.",
  },
];

const ASSURANCES = [
  { icon: ShieldCheck, title: "Verified network", text: "Every partner hospital is vetted for accreditation and outcomes." },
  { icon: Award, title: "Quality first", text: "We prioritise centres of excellence with proven track records." },
  { icon: BadgeCheck, title: "Credentialed doctors", text: "Specialists with verified qualifications and experience." },
];

export default function Accreditation() {
  return (
    <section id="accreditation" className="section-pad">
      <div className="container-x">
        <SectionHeading
          eyebrow="Accreditation & Trust"
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          title="Care you can trust, standards you can verify"
          subtitle="Healtour partners only with hospitals that meet rigorous, internationally recognised quality and safety standards."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ACCREDITATIONS.map((a, i) => (
            <Reveal key={a.mark} delay={0.05 * i}>
              <div className="card card-hover flex h-full flex-col items-center p-7 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 font-display text-lg font-extrabold tracking-tight text-white shadow-glow">
                  {a.mark}
                </span>
                <h3 className="mt-5 text-sm font-semibold text-ink">{a.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">{a.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 grid gap-6 rounded-3xl border border-slate-200/70 bg-surface-2/40 p-8 dark:border-white/[0.07] sm:grid-cols-3">
          {ASSURANCES.map(({ icon: Ico, title, text }) => (
            <div key={title} className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                <Ico className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
