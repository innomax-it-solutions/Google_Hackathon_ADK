/**
 * MVT Bridge brand lockup — the favicon mark (gradient heart + heartbeat) paired
 * with the "MVT Bridge" wordmark and an optional subtitle.
 *
 * The mark is rendered as inline SVG (mirroring /favicon.svg) so it scales
 * crisply, keeps its aspect ratio, and reads correctly in both light and dark
 * mode without shipping a separate raster logo.
 */
function BrandMark({ className = "h-9 w-9" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`${className} flex-shrink-0 object-contain`}
      role="img"
      aria-label="MVT Bridge"
      fill="none"
    >
      <defs>
        <linearGradient id="mvt-mark-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#mvt-mark-gradient)" />
      <g
        transform="translate(6 6) scale(0.833)"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
      </g>
    </svg>
  );
}

export default function MvtBridgeLogo({
  size = "md",
  showSubtitle = false,
  subtitle = "AI-Powered Medical Tourism Platform",
  onDark = false,
  className = "",
}) {
  const marks = {
    sm: "h-7 w-7",
    md: "h-9 w-9 sm:h-10 sm:w-10",
    lg: "h-10 w-10 sm:h-11 sm:w-11",
  };
  const words = {
    sm: "text-base",
    md: "text-xl sm:text-[1.35rem]",
    lg: "text-2xl",
  };
  const subtitleClass = onDark ? "text-slate-400" : "text-ink-muted";
  const brandText = onDark ? "text-white" : "text-ink";

  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <BrandMark className={marks[size]} />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={`font-display font-extrabold tracking-tight ${words[size]} ${brandText}`}
        >
          MVT <span className="text-brand-600 dark:text-brand-400">Bridge</span>
        </span>
        {showSubtitle && (
          <span className={`mt-1 text-[11px] font-medium sm:text-xs ${subtitleClass}`}>
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
