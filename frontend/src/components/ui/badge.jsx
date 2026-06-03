import { cn } from "../../lib/utils";

const VARIANTS = {
  default:     "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  accent:      "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-muted)]",
  success:     "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  destructive: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900",
  outline:     "bg-transparent text-[var(--color-text-tertiary)] border-[var(--color-border)]",
  running:     "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-muted)]",
};

export function Badge({ variant = "default", className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
