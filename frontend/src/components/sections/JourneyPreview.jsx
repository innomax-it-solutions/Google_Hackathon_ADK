import { motion } from "framer-motion";
import {
  Sparkles,
  Stethoscope,
  Building2,
  CheckCircle2,
  CalendarClock,
  Bot,
  TrendingDown,
} from "lucide-react";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import { JOURNEY_PREVIEW as J } from "../../data/landingData";

function Panel({ title, icon, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-5 dark:border-white/[0.07] dark:bg-slate-900 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {icon}
        {title}
      </div>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

export default function JourneyPreview() {
  return (
    <section
      id="journey"
      className="section-pad relative overflow-hidden bg-slate-50/70 dark:bg-slate-900/30"
    >
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-accent-200/30 blur-3xl dark:bg-accent-500/15" />
      <div className="container-x relative">
        <SectionHeading
          eyebrow="Live Preview"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          title="See a journey plan come to life"
          subtitle="A sample of the AI-generated report a patient receives — clear, complete, and ready to act on."
        />

        <Reveal className="mx-auto mt-14 max-w-5xl">
          <div className="gradient-border shadow-glow">
            <div className="rounded-3xl bg-white dark:bg-slate-900">
              {/* Header */}
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-glow">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                      {J.patient.label}
                    </p>
                    <h3 className="font-display text-lg font-bold text-ink">
                      {J.patient.query}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {J.patient.profile.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-ink-soft dark:bg-white/[0.06]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Body grid */}
              <div className="grid gap-5 p-6 lg:grid-cols-2">
                {/* Recommended hospitals */}
                <Panel
                  title="Recommended hospitals"
                  icon={<Building2 className="h-4 w-4 text-brand-500" />}
                >
                  <div className="space-y-3">
                    {J.recommended.map((h) => (
                      <div
                        key={h.name}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
                      >
                        <div className="leading-tight">
                          <p className="text-sm font-semibold text-ink">{h.name}</p>
                          <p className="text-xs text-ink-muted">{h.city}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-brand-600">{h.match}%</p>
                          <p className="text-[11px] font-medium text-ink-muted">{h.tag}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* Estimated cost */}
                <Panel
                  title="Estimated cost"
                  icon={<Stethoscope className="h-4 w-4 text-brand-500" />}
                >
                  <p className="text-xs text-ink-muted">{J.cost.procedure}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-ink">
                    {J.cost.range}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-600">
                    <TrendingDown className="h-3.5 w-3.5" /> {J.cost.savings}
                  </p>
                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
                    {J.cost.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-ink-muted">{item.label}</span>
                        <span className="font-medium text-ink">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* Travel checklist */}
                <Panel
                  title="Travel checklist"
                  icon={<CheckCircle2 className="h-4 w-4 text-brand-500" />}
                >
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {J.checklist.map((c) => (
                      <li
                        key={c}
                        className="flex items-center gap-2 text-sm text-ink-soft"
                      >
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </Panel>

                {/* Timeline */}
                <Panel
                  title="Timeline"
                  icon={<CalendarClock className="h-4 w-4 text-brand-500" />}
                >
                  <ol className="relative space-y-3 pl-4">
                    <span className="absolute left-[3px] top-1 h-[calc(100%-0.5rem)] w-px bg-brand-100 dark:bg-brand-400/20" />
                    {J.timeline.map((t) => (
                      <li key={t.day} className="relative">
                        <span className="absolute -left-4 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-4 ring-brand-100 dark:ring-brand-400/15" />
                        <p className="text-sm font-semibold text-ink">{t.day}</p>
                        <p className="text-xs text-ink-muted">{t.event}</p>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </div>

              {/* AI summary */}
              <div className="m-6 mt-0 rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50/60 p-5 dark:from-brand-500/10 dark:to-accent-500/10">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  <Sparkles className="h-4 w-4" /> AI recommendation summary
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{J.summary}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
