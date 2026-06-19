import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronDown, ChevronRight, Search, ArrowRight, MessageCircle } from "lucide-react";
import {
  PRIMARY_NAV,
  SPECIALTIES,
  TREATMENT_GROUPS,
  RESOURCE_LINKS,
  whatsappLink,
} from "../../data/shellData";
import ThemeToggle from "../ui/ThemeToggle";
import HealtourLogo from "../ui/HealtourLogo";
import Icon from "../ui/Icon";
import SearchOverlay from "../ui/SearchOverlay";

/* ── Desktop dropdown panels ─────────────────────────────────────────────── */

function SpecialtiesPanel({ onNavigate }) {
  return (
    <div className="w-[34rem] p-3">
      <div className="grid grid-cols-2 gap-1">
        {SPECIALTIES.map((s) => (
          <Link
            key={s.slug}
            to={`/specialties/${s.slug}`}
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-white/[0.05]"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300">
              <Icon name={s.icon} className="h-[18px] w-[18px]" />
            </span>
            <span className="text-sm font-medium text-ink-soft group-hover:text-brand-700 dark:group-hover:text-brand-300">
              {s.name}
            </span>
          </Link>
        ))}
      </div>
      <Link
        to="/specialties"
        onClick={onNavigate}
        className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border-t border-slate-100 py-2.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:border-white/10 dark:text-brand-300"
      >
        View all specialties <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function TreatmentsMegaMenu({ onNavigate }) {
  return (
    <div className="w-[52rem] p-5">
      <div className="grid grid-cols-4 gap-5">
        {TREATMENT_GROUPS.map((group) => (
          <div key={group.title}>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              {group.title}
            </h4>
            <ul className="mt-3 space-y-1">
              {group.items.map((t) => (
                <li key={t.slug}>
                  <Link
                    to={`/treatments/${t.slug}`}
                    onClick={onNavigate}
                    className="block rounded-lg px-2 py-1.5 text-sm text-ink-soft transition hover:bg-slate-50 hover:text-brand-700 dark:hover:bg-white/[0.05] dark:hover:text-brand-300"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 px-5 py-4 text-white">
        <div>
          <p className="text-sm font-semibold">Not sure which treatment you need?</p>
          <p className="text-xs text-white/80">
            Let our AI match you to the right hospital and estimate your costs.
          </p>
        </div>
        <Link
          to="/chat"
          onClick={onNavigate}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-white/90"
        >
          Ask Healtour AI <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function ResourcesPanel({ onNavigate }) {
  return (
    <div className="w-72 p-3">
      <ul className="space-y-1">
        {RESOURCE_LINKS.map((r) => (
          <li key={r.label}>
            <Link
              to={r.href}
              onClick={onNavigate}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-white/[0.05]"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink-soft transition group-hover:bg-brand-50 group-hover:text-brand-600 dark:bg-white/[0.06] dark:group-hover:bg-brand-500/15 dark:group-hover:text-brand-300">
                <Icon name={r.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className="text-sm font-medium text-ink-soft group-hover:text-brand-700 dark:group-hover:text-brand-300">
                {r.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PANELS = {
  specialties: SpecialtiesPanel,
  treatments: TreatmentsMegaMenu,
  resources: ResourcesPanel,
};

/* ── Desktop navigation ──────────────────────────────────────────────────── */

function DesktopNav() {
  const [openKey, setOpenKey] = useState(null);
  const closeTimer = useRef(null);

  const open = (key) => {
    clearTimeout(closeTimer.current);
    setOpenKey(key);
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 120);
  };
  const close = () => {
    clearTimeout(closeTimer.current);
    setOpenKey(null);
  };

  return (
    <div className="hidden items-center justify-center gap-0.5 lg:flex">
      {PRIMARY_NAV.map((item) => {
        if (item.type === "link") {
          return (
            <Link key={item.label} to={item.href} className="nav-link">
              {item.label}
            </Link>
          );
        }
        const Panel = PANELS[item.type];
        const isOpen = openKey === item.type;
        return (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => open(item.type)}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => (isOpen ? close() : open(item.type))}
              className="nav-link inline-flex items-center gap-1"
            >
              {item.label}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.16 }}
                  className={`absolute top-full z-50 mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-white/10 dark:bg-slate-900 ${
                    item.type === "treatments"
                      ? "left-1/2 -translate-x-1/2"
                      : "left-0"
                  }`}
                  onMouseEnter={() => open(item.type)}
                  onMouseLeave={scheduleClose}
                >
                  <Panel onNavigate={close} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ── Mobile drawer ───────────────────────────────────────────────────────── */

function MobileAccordion({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200/70 dark:border-slate-800/70">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-1 py-3.5 text-base font-medium text-ink-soft"
      >
        {label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileDrawer({ open, onClose, onOpenSearch }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
            className="fixed inset-y-0 right-0 z-[61] flex w-[86%] max-w-sm flex-col bg-white shadow-2xl dark:bg-slate-950 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 dark:border-slate-800/70">
              <HealtourLogo size="sm" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-ink-soft dark:border-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="mb-4 flex w-full items-center gap-2.5 rounded-xl border border-slate-200 px-4 py-3 text-sm text-ink-muted transition hover:border-brand-200 dark:border-slate-700"
              >
                <Search className="h-4 w-4" />
                Search specialties, treatments…
              </button>

              <MobileAccordion label="Specialties">
                <div className="grid grid-cols-1">
                  {SPECIALTIES.map((s) => (
                    <Link
                      key={s.slug}
                      to={`/specialties/${s.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-ink-muted hover:text-brand-700 dark:hover:text-brand-300"
                    >
                      <Icon name={s.icon} className="h-4 w-4 text-brand-500" />
                      {s.name}
                    </Link>
                  ))}
                  <Link
                    to="/specialties"
                    onClick={onClose}
                    className="mt-1 flex items-center gap-1.5 px-2 py-2 text-sm font-semibold text-brand-600 dark:text-brand-300"
                  >
                    View all <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </MobileAccordion>

              <MobileAccordion label="Treatments">
                {TREATMENT_GROUPS.map((group) => (
                  <div key={group.title} className="mb-3">
                    <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      {group.title}
                    </p>
                    {group.items.map((t) => (
                      <Link
                        key={t.slug}
                        to={`/treatments/${t.slug}`}
                        onClick={onClose}
                        className="block rounded-lg px-2 py-1.5 text-sm text-ink-muted hover:text-brand-700 dark:hover:text-brand-300"
                      >
                        {t.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </MobileAccordion>

              <Link
                to="/hospitals"
                onClick={onClose}
                className="block border-b border-slate-200/70 px-1 py-3.5 text-base font-medium text-ink-soft dark:border-slate-800/70"
              >
                Hospitals
              </Link>
              <Link
                to="/doctors"
                onClick={onClose}
                className="block border-b border-slate-200/70 px-1 py-3.5 text-base font-medium text-ink-soft dark:border-slate-800/70"
              >
                Doctors
              </Link>

              <MobileAccordion label="Resources">
                {RESOURCE_LINKS.map((r) => (
                  <Link
                    key={r.label}
                    to={r.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-ink-muted hover:text-brand-700 dark:hover:text-brand-300"
                  >
                    <Icon name={r.icon} className="h-4 w-4 text-brand-500" />
                    {r.label}
                  </Link>
                ))}
              </MobileAccordion>
            </div>

            <div className="space-y-2.5 border-t border-slate-200/70 px-5 py-4 dark:border-slate-800/70">
              <Link to="/login" onClick={onClose} className="btn-secondary w-full">
                Sign In
              </Link>
              <Link to="/chat" onClick={onClose} className="btn-primary w-full">
                Start Planning <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Navbar ──────────────────────────────────────────────────────────────── */

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen, searchOpen]);

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
        className="container-x flex h-[4.25rem] items-center justify-between gap-4 sm:h-[4.75rem] lg:h-[5rem]"
      >
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0 })}
          className="group min-w-0 transition-opacity hover:opacity-90"
          aria-label="Healtour home"
        >
          <HealtourLogo size="md" showSubtitle />
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft transition hover:bg-slate-100 hover:text-brand-700 dark:hover:bg-white/[0.06] dark:hover:text-brand-300"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          <Link to="/login" className="hidden btn-ghost px-4 lg:inline-flex">
            Sign In
          </Link>
          <Link to="/chat" className="hidden btn-primary px-4 lg:inline-flex">
            Start Planning
          </Link>

          <div className="lg:hidden">
            <ThemeToggle />
          </div>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-soft transition hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:hover:text-brand-300 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
