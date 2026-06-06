import { motion } from "framer-motion";
import { X, Check, Scale, Sparkles } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import { COMPARISON } from "../../data/landingData";

export default function WhyMedBridge() {
  return (
    <section id="why" className="section-pad">
      <div className="container-x">
        <SectionHeading
          eyebrow="Why Healtour"
          icon={<Scale className="h-3.5 w-3.5" />}
          title="The intelligent alternative to manual coordination"
          subtitle="Everything that makes medical tourism stressful — solved by one coordinated AI agent."
        />

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Traditional */}
          <Reveal>
            <div className="h-full rounded-3xl border border-slate-200 bg-slate-50/60 p-7 dark:border-white/[0.07] dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                  <X className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-bold text-ink-soft">
                  {COMPARISON.traditional.title}
                </h3>
              </div>
              <ul className="mt-6 space-y-4">
                {COMPARISON.traditional.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-ink-muted">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400">
                      <X className="h-3 w-3" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Healtour */}
          <Reveal delay={0.1}>
            <div className="relative h-full overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-600 to-accent-600 p-7 text-white shadow-glow">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-bold">{COMPARISON.healtour.title}</h3>
              </div>
              <ul className="relative mt-6 space-y-4">
                {COMPARISON.healtour.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-white/90">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
