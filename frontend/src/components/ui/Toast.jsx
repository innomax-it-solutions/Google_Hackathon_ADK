import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

const VARIANTS = {
  info: {
    Icon: Info,
    accent: "text-brand-600 dark:text-brand-300",
    ring: "ring-brand-100 dark:ring-brand-400/20",
  },
  success: {
    Icon: CheckCircle2,
    accent: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-100 dark:ring-emerald-400/20",
  },
  error: {
    Icon: AlertTriangle,
    accent: "text-red-600 dark:text-red-400",
    ring: "ring-red-100 dark:ring-red-400/20",
  },
};

/**
 * Lightweight, dependency-free toast/snackbar system. Wrap the app once and
 * call `useToast().show(message, { type })` from anywhere.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, { type = "info", duration = 4500 } = {}) => {
      const id = ++idRef.current;
      setToasts((list) => [...list, { id, message, type }]);
      if (duration) window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}

      {/* Toast viewport */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2.5 px-4 sm:top-6">
        <AnimatePresence initial={false}>
          {toasts.map(({ id, message, type }) => {
            const { Icon, accent, ring } = VARIANTS[type] ?? VARIANTS.info;
            return (
              <motion.div
                key={id}
                layout
                role="status"
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-card ring-1 ${ring} dark:border-white/10 dark:bg-slate-900`}
              >
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${accent}`} />
                <p className="flex-1 text-sm leading-relaxed text-ink-soft">
                  {message}
                </p>
                <button
                  type="button"
                  onClick={() => dismiss(id)}
                  aria-label="Dismiss notification"
                  className="rounded-md p-0.5 text-ink-muted transition hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
