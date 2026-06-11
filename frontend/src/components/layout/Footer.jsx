import { ShieldCheck, Check } from "lucide-react";
import { FOOTER } from "../../data/landingData";
import MvtBridgeLogo from "../ui/MvtBridgeLogo";

export default function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden bg-slate-950 text-slate-300">
      {/* Subtle healthcare-tech backdrop: faint grid + soft blue ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-grid opacity-50" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="container-x relative py-16 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1.2fr] lg:gap-12">
          {/* 1 — Branding */}
          <div className="flex flex-col sm:col-span-2 lg:col-span-1 lg:max-w-sm">
            <a href="#top" className="inline-flex" aria-label="MVT Bridge home">
              <MvtBridgeLogo size="md" showSubtitle subtitle="Medical Tourism Platform" onDark />
            </a>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">{FOOTER.description}</p>
          </div>

          {/* 2 — Platform */}
          <nav aria-label="Platform">
            <h4 className="text-sm font-semibold text-white">Platform</h4>
            <ul className="mt-5 space-y-3.5">
              {FOOTER.platform.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-brand-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* 3 — Why MVT Bridge */}
          <div>
            <h4 className="text-sm font-semibold text-white">Why MVT Bridge</h4>
            <ul className="mt-5 space-y-3.5">
              {FOOTER.reasons.map((reason) => (
                <li key={reason} className="flex items-center gap-2.5 text-sm text-slate-400">
                  <Check className="h-4 w-4 flex-shrink-0 text-brand-400" aria-hidden />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} MVT Bridge. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" aria-hidden />
            Secure AI-powered medical tourism platform
          </p>
        </div>
      </div>
    </footer>
  );
}
