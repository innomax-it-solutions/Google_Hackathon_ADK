import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const VARIANTS = {
  default:     "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-sm",
  gradient:    "bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 active:from-indigo-600 active:to-violet-700 text-white shadow-sm",
  secondary:   "bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
  outline:     "border border-[var(--color-border)] hover:border-[var(--color-accent-muted)] bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]",
  ghost:       "hover:bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
  destructive: "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20",
};

const SIZES = {
  sm:       "h-7 px-2.5 text-[12px] gap-1 rounded-lg",
  default:  "h-9 px-3.5 text-[13px] gap-1.5 rounded-xl",
  lg:       "h-10 px-4 text-[14px] gap-2 rounded-xl",
  icon:     "h-8 w-8 rounded-lg",
  "icon-sm":"h-7 w-7 rounded-md",
  "icon-lg":"h-9 w-9 rounded-xl",
};

const BASE = "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none whitespace-nowrap";

export function Button({
  variant  = "default",
  size     = "default",
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <motion.button
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.95 }}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
