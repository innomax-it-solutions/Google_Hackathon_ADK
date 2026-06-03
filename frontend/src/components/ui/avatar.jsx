import { cn } from "../../lib/utils";

export function Avatar({ className, children, ...props }) {
  return (
    <div
      className={cn("relative flex shrink-0 overflow-hidden rounded-xl", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarFallback({ className, children, gradient, ...props }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center text-white",
        gradient
          ? "bg-gradient-to-br from-indigo-500 to-violet-600"
          : "bg-[var(--color-surface-2)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
