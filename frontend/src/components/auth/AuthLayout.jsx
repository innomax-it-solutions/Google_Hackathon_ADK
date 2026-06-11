import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartPulse, ArrowLeft, ShieldCheck, Sparkles, Globe2 } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import MvtBridgeLogo from "../ui/MvtBridgeLogo";

const HIGHLIGHTS = [
  { icon: Sparkles, title: "AI journey coordination", text: "Hospital matching, cost estimates, and travel prep in one guided flow." },
  { icon: ShieldCheck, title: "Accredited network", text: "A curated network of JCI & NABH accredited hospitals you can trust." },
  { icon: Globe2, title: "Built for patients worldwide", text: "Document and visa guidance tailored to your country of travel." },
];

/** Branded left rail — fixed navy panel that reads the same in both themes. */
function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col">
      {/* subtle, restrained decoration (no flashy gradients) */}
      <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-grid opacity-70" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl" />

      <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
        <Link to="/" className="group inline-flex" aria-label="MVT Bridge home">
          <MvtBridgeLogo size="md" showSubtitle subtitle="Medical Value Tourism" onDark />
        </Link>

        <div className="max-w-md">
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl font-bold leading-tight tracking-tight text-white xl:text-[2.25rem]"
          >
            Your treatment journey, intelligently coordinated.
          </motion.h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Sign in to explore AI-guided medical tourism — from finding the right
            hospital to preparing every document for the trip.
          </p>

          <ul className="mt-9 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.1 }}
                className="flex items-start gap-3.5"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-brand-300">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} MVT Bridge
        </p>
      </div>
    </div>
  );
}

/**
 * Two-column auth shell: branding rail on the left (lg+), form on the right.
 * The form column adapts to light/dark; the brand rail stays navy.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      {/* Form column */}
      <div className="relative flex flex-col bg-canvas">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink-soft"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>
          <ThemeToggle />
        </div>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-2 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {/* Compact logo (mobile only — brand rail is hidden there) */}
            <Link to="/" className="mb-8 inline-flex lg:hidden" aria-label="MVT Bridge home">
              <MvtBridgeLogo size="md" showSubtitle subtitle="Medical Value Tourism" />
            </Link>

            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-ink-muted">{subtitle}</p>}

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-7 text-center text-sm text-ink-muted">{footer}</div>}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
