import { createContext, useContext, useEffect, useRef, useState, cloneElement, isValidElement } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

/* ── Context ── */
const Ctx = createContext(null);

/* ── Root ── */
export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <Ctx.Provider value={{ open, toggle: () => setOpen(o => !o), close: () => setOpen(false) }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </Ctx.Provider>
  );
}

/* ── Trigger ── */
export function DropdownMenuTrigger({ children, asChild }) {
  const { toggle, open } = useContext(Ctx);

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        toggle();
      },
      "aria-expanded": open,
      "aria-haspopup": "true",
    });
  }

  return (
    <button onClick={toggle} aria-expanded={open} aria-haspopup="true">
      {children}
    </button>
  );
}

/* ── Content panel ── */
export function DropdownMenuContent({ children, align = "end", side = "bottom", className, sideOffset = 8 }) {
  const { open } = useContext(Ctx);
  const isTop = side === "top"; // open upward (for triggers anchored at the bottom of the screen)
  const offY = isTop ? 6 : -6;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: offY }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{ opacity: 0, scale: 0.95,    y: offY }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={isTop ? { marginBottom: sideOffset } : { marginTop: sideOffset }}
          className={cn(
            "absolute z-50 min-w-[210px]",
            isTop ? "bottom-full" : "top-full",
            "bg-[var(--color-surface)] border border-[var(--color-border)]",
            "rounded-2xl shadow-dropdown overflow-hidden py-1.5",
            align === "end" ? "right-0" : "left-0",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Item ── */
export function DropdownMenuItem({ children, onClick, destructive, icon, shortcut, disabled, className }) {
  const { close } = useContext(Ctx);

  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        if (!disabled) {
          onClick?.(e);
          close();
        }
      }}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-xl mx-1.5",
        "transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed",
        "w-[calc(100%-12px)]",
        destructive
          ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]",
        className
      )}
    >
      {icon && <span className="opacity-60 flex-shrink-0 w-4 h-4 flex items-center justify-center">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && (
        <kbd className="text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-2)] border border-[var(--color-border)] px-1.5 py-0.5 rounded font-sans">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

/* ── Separator ── */
export function DropdownMenuSeparator({ className }) {
  return <div className={cn("border-t border-[var(--color-border-subtle)] my-1.5 mx-3", className)} />;
}

/* ── Label ── */
export function DropdownMenuLabel({ children, className }) {
  return (
    <div className={cn("px-4 py-1.5 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest", className)}>
      {children}
    </div>
  );
}
