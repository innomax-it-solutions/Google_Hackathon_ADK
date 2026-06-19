import { ShieldCheck, Building2, Globe, Wallet, BadgeCheck } from "lucide-react";

const SIGNALS = [
  { icon: ShieldCheck, label: "JCI & NABH Accredited" },
  { icon: Building2, label: "22+ Partner Hospitals" },
  { icon: Globe, label: "15+ Countries Served" },
  { icon: Wallet, label: "Transparent Pricing" },
  { icon: BadgeCheck, label: "Verified Doctors" },
];

/**
 * TrustBar — slim strip of trust signals shown directly under the hero to
 * reinforce credibility before the visitor scrolls further.
 */
export default function TrustBar() {
  return (
    <section aria-label="Why patients trust Healtour" className="border-y border-slate-200/70 bg-surface-2/40 dark:border-slate-800/70">
      <div className="container-x">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4 py-6 sm:grid-cols-3 lg:flex lg:items-center lg:justify-between lg:py-5">
          {SIGNALS.map(({ icon: Ico, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                <Ico className="h-[18px] w-[18px]" />
              </span>
              <span className="text-sm font-semibold text-ink-soft">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
