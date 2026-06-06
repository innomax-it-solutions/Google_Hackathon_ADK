import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "../../data/landingData";
import ThemeToggle from "../ui/ThemeToggle";

function Logo() {
  return (
    <a
      href="#top"
      className="group flex min-w-0 flex-col gap-1"
      aria-label="Healtour home"
    >
      <img
        src="/healtour-logo.png"
        alt="Healtour — Click. Fly. Heal."
        className="h-9 w-auto max-w-[180px] object-contain object-left transition-opacity group-hover:opacity-90 sm:h-10 sm:max-w-[200px]"
      />
      <span className="text-[11px] font-medium text-ink-muted sm:text-xs">
        Medical Tourism Platform
      </span>
    </a>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/70 bg-white/80 shadow-soft backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/80"
          : "border-b border-slate-200/50 bg-white/60 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/50"
      }`}
    >
      <nav
        aria-label="Primary"
        className="container-x flex h-[4.25rem] items-center justify-between gap-4 sm:h-[4.75rem] lg:grid lg:h-[5rem] lg:grid-cols-[1fr_auto_1fr] lg:items-center"
      >
        <Logo />

        <div className="hidden items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center justify-end gap-3 lg:flex">
          <ThemeToggle />
          <Link to="/login" className="btn-ghost px-4">
            Sign In
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-soft transition hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:hover:text-brand-300"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden"
          >
            <div className="container-x space-y-1 border-t border-slate-200/70 bg-white/95 pb-6 pt-3 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/95">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-ink-soft transition hover:bg-slate-100 hover:text-brand-700 dark:hover:bg-slate-800 dark:hover:text-brand-300"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
