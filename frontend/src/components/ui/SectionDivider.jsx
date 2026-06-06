/**
 * Decorative separators between sections.
 * variant="gradient" -> thin gradient hairline
 * variant="wave"     -> soft curved SVG divider (fill matches the next section)
 */
export default function SectionDivider({ variant = "gradient", flip = false, className = "" }) {
  if (variant === "wave") {
    return (
      <div aria-hidden="true" className={`pointer-events-none -mb-px leading-none ${className}`}>
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className={`h-12 w-full text-slate-50 dark:text-slate-900/40 sm:h-16 ${
            flip ? "rotate-180" : ""
          }`}
        >
          <path
            fill="currentColor"
            d="M0,40 C240,90 480,0 720,30 C960,60 1200,95 1440,45 L1440,80 L0,80 Z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={`container-x ${className}`}>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
    </div>
  );
}
