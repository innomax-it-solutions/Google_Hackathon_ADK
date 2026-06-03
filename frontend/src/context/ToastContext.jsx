import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ToastCtx = createContext(null);
let _id = 0;

/* ── Provider ── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(({
    title,
    description,
    variant  = "default",
    duration = 3500,
  }) => {
    const id = ++_id;
    setToasts(prev => [...prev.slice(-4), { id, title, description, variant }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
}

/* ── Viewport ── */
function ToastViewport({ toasts, dismiss }) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col-reverse gap-2 w-full max-w-[360px] px-4 pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <ToastItem key={t.id} data={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ── Single toast ── */
function ToastItem({ data, onDismiss }) {
  const { variant, title, description } = data;

  const iconColor = {
    default: "text-[var(--color-accent)]",
    success: "text-emerald-500",
    error:   "text-red-500",
    info:    "text-[var(--color-accent)]",
  }[variant] ?? "text-[var(--color-accent)]";

  const Icon = {
    success: CheckCircleIcon,
    error:   XCircleIcon,
    info:    InfoIcon,
    default: InfoIcon,
  }[variant] ?? InfoIcon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{ opacity: 0,    y: -8, scale: 0.94 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-dropdown px-4 py-3 flex items-start gap-3"
    >
      <span className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
        <Icon />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium text-[var(--color-text-primary)] leading-snug">{title}</p>
        {description && (
          <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <XIcon />
      </button>
    </motion.div>
  );
}

/* ── Inline icons ── */
const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const XCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const XIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
