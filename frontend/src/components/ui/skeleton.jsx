import { cn } from "../../lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-[var(--color-surface-2)]", className)}
      {...props}
    />
  );
}

/** Full assistant message loading placeholder */
export function MessageSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 sm:px-6">
      <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2.5 pt-1 min-w-0">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
    </div>
  );
}
