import ParentCompanyBadge from "./ParentCompanyBadge";

/**
 * Reusable Healtour brand lockup — logo image with optional subtitle and parent badge.
 */
export default function HealtourLogo({
  showSubtitle = false,
  showBadge = false,
  badgeVariant = "default",
  size = "md",
  layout = "stacked",
  className = "",
  onDark = false,
}) {
  // Slightly larger by default so the lockup feels confident on desktop,
  // but still scales down cleanly on smaller screens.
  const heights = {
    sm: "h-7 max-w-[140px]",
    md: "h-9 sm:h-10 max-w-[180px] sm:max-w-[200px]",
    lg: "h-10 sm:h-11 max-w-[200px] sm:max-w-[220px]",
  };
  const subtitleClass = onDark ? "text-slate-400" : "text-ink-muted";

  const logo = (
    <img
      src="/healtour-logo.png"
      alt="Healtour — Click. Fly. Heal."
      className={`${heights[size]} w-auto object-contain object-left`}
    />
  );

  if (layout === "inline") {
    return (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        {logo}
        {(showSubtitle || showBadge) && (
          <span className="flex flex-col gap-0.5 leading-none">
            {showSubtitle && (
              <span className={`text-[10px] font-medium ${subtitleClass}`}>
                Medical Tourism Platform
              </span>
            )}
            {showBadge && <ParentCompanyBadge variant={badgeVariant} />}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-col gap-1.5 leading-none ${className}`}>
      {logo}
      {showSubtitle && (
        <span className={`text-[11px] font-medium ${subtitleClass}`}>
          Medical Tourism Platform
        </span>
      )}
      {showBadge && <ParentCompanyBadge variant={badgeVariant} className="mt-0.5" />}
    </span>
  );
}
