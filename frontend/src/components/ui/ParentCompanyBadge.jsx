import { ShieldCheck } from "lucide-react";

const VARIANTS = {
  default:
    "border-emerald-100/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-300",
  navbar:
    "border-emerald-100/80 bg-emerald-50/90 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-300",
  footer:
    "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
};

/** Subtle parent-company trust badge — Innomax Skills Company. */
export default function ParentCompanyBadge({ variant = "default", className = "" }) {
  const isNavbar = variant === "navbar";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium leading-none shadow-[0_0_0_1px_rgba(255,255,255,0.2)]/0 ${VARIANTS[variant]} ${className}`}
    >
      <ShieldCheck
        className={`flex-shrink-0 text-emerald-500 ${isNavbar ? "h-2.5 w-2.5" : "h-3 w-3"}`}
        aria-hidden
      />
      <span>An Innomax Skills Company</span>
    </span>
  );
}
