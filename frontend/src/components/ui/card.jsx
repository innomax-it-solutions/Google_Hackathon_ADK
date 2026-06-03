import { cn } from "../../lib/utils";

export function Card({ className, hover, onClick, children, ...props }) {
  const interactive = !!onClick;
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl transition-all duration-200",
        interactive && "cursor-pointer hover:border-[var(--color-accent-muted)] hover:shadow-card-hover hover:-translate-y-0.5",
        hover && !interactive && "hover:shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return <div className={cn("p-5 pb-3", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn("font-semibold text-[14px] text-[var(--color-text-primary)] leading-snug", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn("text-[12.5px] text-[var(--color-text-tertiary)] mt-1 leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return <div className={cn("px-5 pb-4", className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }) {
  return <div className={cn("px-5 pb-4 pt-0 flex items-center gap-2", className)} {...props}>{children}</div>;
}
