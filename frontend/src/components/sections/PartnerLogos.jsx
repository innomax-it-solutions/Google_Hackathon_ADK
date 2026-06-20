import Reveal from "../ui/Reveal";

/**
 * PartnerLogos — a logo wall of partner hospitals. Uses typographic monogram
 * tiles (initials + name) so no external logo assets are required; real logo
 * images can replace the monograms later without changing the layout.
 */
const PARTNERS = [
  { name: "Apollo Hospital", initials: "AP" },
  { name: "Fortis Healthcare", initials: "FH" },
  { name: "MGM Healthcare", initials: "MG" },
  { name: "TX Hospitals", initials: "TX" },
  { name: "SRM Institutes (SIMS)", initials: "SI" },
  { name: "Royal Care", initials: "RC" },
  { name: "Yashoda Hospitals", initials: "YH" },
  { name: "Rela Hospital", initials: "RL" },
  { name: "Gleneagles", initials: "GL" },
  { name: "Healing Hands", initials: "HH" },
  { name: "Be Well", initials: "BW" },
  { name: "Rainbow Children's", initials: "RB" },
];

export default function PartnerLogos() {
  return (
    <section aria-label="Partner hospitals" className="section-pad bg-surface-2/40">
      <div className="container-x">
        <Reveal>
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Trusted by leading accredited hospitals
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PARTNERS.map((p, i) => (
            <Reveal key={p.name} delay={0.03 * i}>
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 text-center shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200/70 hover:shadow-card dark:border-white/[0.07] dark:bg-slate-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 font-display text-sm font-extrabold tracking-tight text-ink-soft dark:bg-white/[0.06]">
                  {p.initials}
                </span>
                <span className="text-xs font-medium leading-tight text-ink-muted">{p.name}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
