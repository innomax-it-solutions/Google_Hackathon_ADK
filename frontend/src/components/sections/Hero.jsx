import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Building2, Sparkles } from "lucide-react";
import Icon from "../ui/Icon";
import { HERO_STATS } from "../../data/landingData";
import BenefitsCircleStage from "./BenefitsCircle";

function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-brand-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-brand-950/20" />
      <div className="absolute right-0 top-1/4 h-[520px] w-[520px] -translate-y-1/4 translate-x-1/4 rounded-full bg-brand-200/30 blur-3xl dark:bg-brand-600/10" />
      <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-brand-100/40 blur-3xl dark:bg-brand-500/5" />
    </div>
  );
}

function BenefitsCircleVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto flex items-center justify-center"
    >
      {/* Ambient glow — soft healthcare lighting behind the ecosystem */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute h-[78%] w-[78%] rounded-full bg-gradient-to-br from-brand-200/30 via-brand-100/15 to-accent-100/20 blur-3xl dark:from-brand-600/15 dark:via-brand-500/8 dark:to-accent-500/10" />
        <motion.div
          animate={{ opacity: [0.4, 0.65, 0.4], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
          className="absolute h-[34%] w-[34%] rounded-full bg-brand-300/20 blur-2xl dark:bg-brand-400/12"
        />
      </div>

      {/* Footprint box is sized to the *scaled* stage at each breakpoint so the
          600px stage collapses to a balanced, lightweight visual — no oversized
          empty space. The stage itself is centred and scaled within it; labels
          overflow visibly and never clip. */}
      <div className="relative h-[306px] w-[306px] min-[480px]:h-[360px] min-[480px]:w-[360px] sm:h-[396px] sm:w-[396px] lg:h-[432px] lg:w-[432px]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.51] origin-center min-[480px]:scale-[0.6] sm:scale-[0.66] lg:scale-[0.72]">
          <BenefitsCircleStage />
        </div>
      </div>
    </motion.div>
  );
}

function HeroStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-slate-200/70 pt-8 dark:border-slate-800 sm:grid-cols-4"
    >
      {HERO_STATS.map((stat) => (
        <div key={stat.label} className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
              stat.accent
                ? "bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400"
                : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
            }`}
          >
            <Icon name={stat.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0 leading-tight">
            <p
              className={`font-display text-lg font-bold sm:text-xl ${
                stat.accent
                  ? "text-accent-600 dark:text-accent-400"
                  : "text-brand-600 dark:text-brand-400"
              }`}
            >
              {stat.value}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{stat.label}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{stat.subtitle}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yVisual = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yCopy = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative overflow-hidden pb-12 pt-32 sm:pb-16 sm:pt-36 lg:pt-40"
    >
      <AnimatedBackground />

      <div className="container-x">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14 xl:gap-16">
          <motion.div
            style={{ y: yCopy }}
            className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left"
          >
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="eyebrow"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Powered Medical Tourism
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-5 font-display text-fluid-hero font-extrabold tracking-tight text-ink"
            >
              AI-Powered Medical Tourism{" "}
              <span className="text-brand-600 dark:text-brand-400">Made Simple</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-5 text-lg leading-relaxed text-ink-muted"
            >
              MVT Bridge helps international patients find trusted hospitals, estimate treatment
              costs, and coordinate every step of their medical travel journey with AI-powered
              guidance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap lg:items-start"
            >
              <Link to="/chat" className="btn-primary w-full sm:w-auto">
                Explore Your Journey <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#hospitals" className="btn-secondary w-full sm:w-auto">
                <Building2 className="h-4 w-4" /> View Hospitals
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            style={{ y: yVisual }}
            className="relative mx-auto w-full max-w-xl lg:max-w-none"
          >
            <BenefitsCircleVisual />
          </motion.div>
        </div>

        <HeroStats />
      </div>
    </section>
  );
}
