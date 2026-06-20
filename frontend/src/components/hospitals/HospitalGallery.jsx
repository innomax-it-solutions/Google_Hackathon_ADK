import { useState } from "react";
import { Building2, BedDouble, Stethoscope, ShieldCheck } from "lucide-react";
import { initials, deptGradient } from "./hospitalMeta";

/**
 * ImageTile — renders an <img> if the asset loads, otherwise a gradient
 * fallback. Hospital photo assets are not bundled today, so the fallback is
 * what shows until real images are added under /public/hospital-photos/.
 */
function ImageTile({ src, alt, gradient, fallback, className = "" }) {
  const [failed, setFailed] = useState(!src);
  if (!failed && src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${gradient} text-white ${className}`}>
      {fallback}
    </div>
  );
}

const FACILITIES = [
  { icon: BedDouble, label: "Inpatient care" },
  { icon: Stethoscope, label: "Specialist OPDs" },
  { icon: ShieldCheck, label: "Accredited facility" },
];

/**
 * HospitalGallery — a visual overview of the hospital. The primary tile shows
 * the hospital photo (with a gradient/monogram fallback); the remaining tiles
 * highlight facilities. Replace the placeholders by adding real images later.
 */
export default function HospitalGallery({ hospital }) {
  const h = hospital;
  const gradient = deptGradient(h.name);
  // Forward-looking asset path; falls back gracefully until images are added.
  const photoSrc = h.photo ? `/uploads/${h.photo}` : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:grid-rows-2">
      <div className="col-span-2 row-span-2 aspect-[4/3] overflow-hidden rounded-2xl sm:aspect-auto">
        <ImageTile
          src={photoSrc}
          alt={h.name}
          gradient={gradient}
          fallback={
            <>
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 font-display text-2xl font-extrabold backdrop-blur-sm">
                {initials(h.name)}
              </span>
              <span className="px-4 text-center text-sm font-semibold">{h.name}</span>
            </>
          }
        />
      </div>

      {FACILITIES.map(({ icon: Ico, label }) => (
        <div
          key={label}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-surface-2/60 p-3 text-center dark:border-white/[0.07]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <Ico className="h-5 w-5" />
          </span>
          <span className="text-xs font-medium text-ink-muted">{label}</span>
        </div>
      ))}
      <div className="hidden aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-surface-2/60 p-3 text-center dark:border-white/[0.07] sm:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          <Building2 className="h-5 w-5" />
        </span>
        <span className="text-xs font-medium text-ink-muted">Modern campus</span>
      </div>
    </div>
  );
}
