import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Search, MessageCircle, Stethoscope } from "lucide-react";
import Icon from "../ui/Icon";
import SearchableSelect from "../ui/SearchableSelect";
import { HERO_STATS } from "../../data/landingData";
import { SPECIALTIES, whatsappLink } from "../../data/shellData";
import BenefitsCircleStage from "./BenefitsCircle";

const SPECIALTY_OPTIONS = SPECIALTIES.map((s) => ({ value: s.slug, label: s.name }));

/**
 * HeroSearch — primary entry point: pick a specialty and/or type a treatment,
 * then jump to the relevant directory/search route. Routes are forward-looking
 * (directory pages land in a later phase). Includes a WhatsApp CTA.
 */
function HeroSearch() {
  const [specialty, setSpecialty] = useState("");
  const [treatment, setTreatment] = useState("");
  const navigate = useNavigate();

  function onSubmit(e) {
    e.preventDefault();
    const q = treatment.trim();
    if (q) {
      const prefix = specialty ? `${specialty} ` : "";
      navigate(`/search?q=${encodeURIComponent(prefix + q)}`);
    } else if (specialty) {
      navigate(`/specialties/${specialty}`);
    } else {
      navigate("/search");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25 }}
      className="mt-8"
    >
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchableSelect
              value={specialty}
              onChange={setSpecialty}
              options={SPECIALTY_OPTIONS}
              placeholder="Choose a specialty"
              searchPlaceholder="Search specialties…"
            />
          </div>
          <div className="relative flex-1">
            <Stethoscope className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="Search a treatment or procedure"
              aria-label="Search a treatment"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-3.5 text-[14px] text-ink transition-colors placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900"
            />
          </div>
          <button type="submit" className="btn-primary sm:w-auto">
            <Search className="h-4 w-4" /> Search
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap lg:items-start">
        <Link to="/chat" className="btn-secondary w-full sm:w-auto">
          <Sparkles className="h-4 w-4" /> Plan with Healtour AI
        </Link>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 sm:w-auto"
        >
          <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
        </a>
      </div>
    </motion.div>
  );
}

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
              Healtour helps international patients find trusted hospitals, estimate treatment
              costs, and coordinate every step of their medical travel journey with AI-powered
              guidance.
            </motion.p>

            <HeroSearch />
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
