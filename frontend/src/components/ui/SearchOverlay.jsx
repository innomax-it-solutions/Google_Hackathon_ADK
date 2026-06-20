import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import { SPECIALTIES, POPULAR_TREATMENTS } from "../../data/shellData";

/**
 * SearchOverlay — full-screen search entry for the shell.
 *
 * Controlled (parent owns open/onClose). Submitting routes to /search?q=…
 * (directory/search pages arrive in a later phase). Shows quick suggestions
 * for popular specialties and treatments. Esc closes; input autofocuses.
 */
export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [open, onClose]);

  function go(to) {
    onClose();
    setQuery("");
    navigate(to);
  }

  function onSubmit(e) {
    e.preventDefault();
    const q = query.trim();
    if (q) go(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/60 px-4 pt-24 backdrop-blur-sm sm:pt-32"
          onMouseDown={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Search Healtour"
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
          >
            <form onSubmit={onSubmit} className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <Search className="h-5 w-5 flex-shrink-0 text-ink-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search specialties, treatments, hospitals…"
                className="w-full bg-transparent text-base text-ink placeholder:text-ink-muted focus:outline-none"
                aria-label="Search query"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </form>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Popular specialties
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SPECIALTIES.slice(0, 8).map((s) => (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => go(`/specialties/${s.slug}`)}
                      className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm text-ink-soft transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-white/10 dark:hover:border-brand-400/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Popular treatments
                </p>
                <ul className="mt-3 space-y-1">
                  {POPULAR_TREATMENTS.map((t) => (
                    <li key={t.slug}>
                      <button
                        type="button"
                        onClick={() => go(`/treatments/${t.slug}`)}
                        className="group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-slate-100 hover:text-brand-700 dark:hover:bg-white/[0.06] dark:hover:text-brand-300"
                      >
                        {t.name}
                        <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-0 transition group-hover:opacity-100" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
