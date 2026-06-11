/*
 * RecoveryCard.jsx — the post-operative continuum-of-care card.
 *
 * Renders the get_aftercare_plan tool payload as a standalone, dashboard-styled
 * card (matching JourneyPlanCard's visual language). It is shown by MessageBubble
 * only on the turn where the patient asked about recovery/after-surgery care — it
 * never appears inside the initial Journey Plan.
 *
 * All content is data-backed (from backend/data/aftercare_rules.json); this
 * component only lays it out. Every field self-guards so a missing section just
 * doesn't render.
 */

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

export default function RecoveryCard({ plan, isLoading = false }) {
  if (!plan) {
    return isLoading ? <CardSkeleton /> : null;
  }

  const {
    status,
    specialty_label,
    procedure,
    fit_to_fly_days,
    fit_to_fly_window,
    fit_to_fly_note,
    in_india_review,
    recovery_phases = [],
    teleconsult_schedule = [],
    red_flags = [],
    physiotherapy = {},
    medication_wound_care = [],
    follow_up_tests = [],
    diet_lifestyle = [],
    specialty_note,
    disclaimer,
  } = plan;

  const isGeneral = status === "fallback" || status === "unrecognized";
  const subtitle = [specialty_label, prettyProcedure(procedure)].filter(Boolean).join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="bg-[var(--color-surface)] rounded-2xl shadow-card-hover border border-[var(--color-border)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)]">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex-shrink-0">
          <IconRecovery />
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] leading-tight">Recovery &amp; Aftercare</h3>
          {subtitle && <p className="text-[12px] text-[var(--color-text-tertiary)] truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {isGeneral && (
          <div className="rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-[12.5px] text-amber-700 dark:text-amber-400">
            This is <strong>general</strong> recovery guidance, not specific to your exact procedure.
            Tell me the specific procedure for a tailored plan.
          </div>
        )}

        {/* Fit-to-fly hero */}
        {Number.isFinite(fit_to_fly_days) && (
          <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-subtle)] p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <IconPlane className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-accent)]">When you can fly home</span>
            </div>
            <p className="text-[20px] font-extrabold text-[var(--color-text-primary)] leading-none">
              ~{fit_to_fly_days} days
              {fit_to_fly_window && (
                <span className="text-[12px] font-medium text-[var(--color-text-tertiary)] ml-2">({fit_to_fly_window} post-op)</span>
              )}
            </p>
            {fit_to_fly_note && <p className="text-[12.5px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">{fit_to_fly_note}</p>}
            {in_india_review?.before_flying && (
              <p className="text-[12px] text-[var(--color-text-tertiary)] mt-2 leading-relaxed">
                <strong className="text-[var(--color-text-secondary)]">Before you fly:</strong> {in_india_review.before_flying}
                {in_india_review.typical_day ? ` (${in_india_review.typical_day})` : ""}
              </p>
            )}
          </div>
        )}

        {/* Recovery timeline */}
        {recovery_phases.length > 0 && (
          <Section title="Recovery timeline" icon={<IconTimeline />}>
            <ol className="space-y-2">
              {recovery_phases.map((p, i) => (
                <li key={i} className="relative pl-4 border-l-2 border-[var(--color-border)]">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{p.phase}</span>
                    {p.window && <span className="text-[11px] font-medium text-[var(--color-accent)]">{p.window}</span>}
                  </div>
                  {p.focus && <p className="text-[12.5px] text-[var(--color-text-secondary)] leading-relaxed">{p.focus}</p>}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Warning signs — alert styling */}
        {red_flags.length > 0 && (
          <Section title="Warning signs — seek care" icon={<IconAlert />} tone="danger">
            <ul className="space-y-1">
              {red_flags.map((f, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] text-red-700 dark:text-red-400 leading-relaxed">
                  <span className="text-red-500 mt-[3px] flex-shrink-0">●</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Follow-up schedule */}
        {teleconsult_schedule.length > 0 && (
          <Section title="Follow-up schedule" icon={<IconCalendar />}>
            <ul className="space-y-1.5">
              {teleconsult_schedule.map((t, i) => (
                <li key={i} className="text-[12.5px] leading-relaxed">
                  <span className="font-semibold text-[var(--color-text-primary)]">{t.when}</span>
                  {t.purpose && <span className="text-[var(--color-text-secondary)]"> — {t.purpose}</span>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Two-up detail sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {physiotherapy?.guidance && (
            <Section title="Physiotherapy & rehab" icon={<IconActivity />}>
              <p className="text-[12.5px] text-[var(--color-text-secondary)] leading-relaxed">{physiotherapy.guidance}</p>
              {physiotherapy.start && <p className="text-[11.5px] text-[var(--color-text-tertiary)] mt-1">{physiotherapy.start}</p>}
            </Section>
          )}
          {medication_wound_care.length > 0 && (
            <Section title="Medication & wound care" icon={<IconPill />}>
              <BulletList items={medication_wound_care} />
            </Section>
          )}
          {follow_up_tests.length > 0 && (
            <Section title="Follow-up tests" icon={<IconLab />}>
              <BulletList items={follow_up_tests} />
            </Section>
          )}
          {diet_lifestyle.length > 0 && (
            <Section title="Diet & lifestyle" icon={<IconLeaf />}>
              <BulletList items={diet_lifestyle} />
            </Section>
          )}
        </div>

        {/* Specialty note */}
        {specialty_note && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-[12.5px] text-[var(--color-text-secondary)] leading-relaxed">
            <strong className="text-[var(--color-text-primary)]">Note:</strong> {specialty_note}
          </div>
        )}

        {/* Disclaimer */}
        {disclaimer && (
          <p className="text-[11px] text-[var(--color-text-tertiary)] italic leading-relaxed pt-1 border-t border-[var(--color-border-subtle)]">
            {disclaimer}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function Section({ title, icon, tone, children }) {
  const danger = tone === "danger";
  return (
    <section className={`rounded-xl border p-3.5 ${danger
      ? "border-red-300/50 bg-red-50/50 dark:bg-red-950/10"
      : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}>
      <header className="flex items-center gap-2 mb-2">
        <span className={`grid place-items-center w-6 h-6 rounded-lg ${danger
          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"}`}>
          {icon}
        </span>
        <h4 className={`text-[11px] font-bold tracking-wider uppercase ${danger ? "text-red-600 dark:text-red-400" : "text-[var(--color-text-tertiary)]"}`}>
          {title}
        </h4>
      </header>
      {children}
    </section>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-1">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-[12.5px] text-[var(--color-text-secondary)] leading-relaxed">
          <span className="text-[var(--color-accent)] mt-[3px] flex-shrink-0 text-[9px]">●</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function prettyProcedure(slug) {
  if (!slug) return "";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function CardSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl shadow-card-hover border border-[var(--color-border)] p-5 space-y-3 animate-pulse">
      <div className="h-4 w-1/3 bg-[var(--color-surface-2)] rounded" />
      <div className="h-20 w-full bg-[var(--color-surface-2)] rounded-xl" />
      <div className="h-3 w-2/3 bg-[var(--color-surface-2)] rounded" />
      <div className="h-3 w-1/2 bg-[var(--color-surface-2)] rounded" />
    </div>
  );
}

/* ── icons (self-contained, stroke-based to match the card family) ─────────── */
const I = (p) => ({ className: "w-3.5 h-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, ...p });
const IconRecovery = () => (
  <svg {...I({ className: "w-[18px] h-[18px]" })}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
);
const IconPlane = ({ className }) => (
  <svg {...I({ className })}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.27 6.96a.6.6 0 01.7-.86l2.7.74L11 3l1 .5-1.5 4.5 4 1 1.5-2 1 .5-1 3 1 3-1 .5-1.5-2-4 1L12 17l1.5 4.5-1 .5-3.33-3.84-2.7.74a.6.6 0 01-.7-.86L6 12z" /></svg>
);
const IconTimeline = () => (
  <svg {...I()}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const IconAlert = () => (
  <svg {...I()}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
);
const IconCalendar = () => (
  <svg {...I()}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V11.25A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
);
const IconActivity = () => (
  <svg {...I()}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h3l2.25 6 4.5-12 2.25 6h3.75" /></svg>
);
const IconPill = () => (
  <svg {...I()}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 20.5L20.5 10.5a4.95 4.95 0 00-7-7L3.5 13.5a4.95 4.95 0 007 7zM8 8l8 8" /></svg>
);
const IconLab = () => (
  <svg {...I()}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M10 3v6.5L5.5 17a2 2 0 001.8 3h9.4a2 2 0 001.8-3L14 9.5V3" /></svg>
);
const IconLeaf = () => (
  <svg {...I()}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21c8 0 14-5 14-14V4h-3C7 4 3 9 3 16v5zm0 0L14 10" /></svg>
);
