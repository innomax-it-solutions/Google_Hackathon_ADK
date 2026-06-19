import { Link } from "react-router-dom";
import { MapPin, BedDouble, Stethoscope, ShieldCheck, ArrowRight } from "lucide-react";
import { initials, deptGradient, shortLocation, isAccredited } from "./hospitalMeta";

/**
 * HospitalCard — compact hospital summary for grids. No hospital photos are
 * bundled, so the header is a gradient monogram (consistent with the rest of
 * the directory visuals).
 */
export default function HospitalCard({ hospital }) {
  const h = hospital;
  const location = shortLocation(h);
  const depts = h.departments || [];

  return (
    <Link
      to={`/hospitals/${h.slug}`}
      className="card card-hover group flex h-full flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className={`relative flex h-28 items-center gap-4 bg-gradient-to-br ${deptGradient(h.name)} px-5`}>
        <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 font-display text-xl font-extrabold tracking-tight text-white backdrop-blur-sm">
          {initials(h.name)}
        </span>
        {isAccredited(h) && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" /> Accredited
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold leading-snug text-ink line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300">
          {h.name}
        </h3>
        {location && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-ink-muted">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-brand-500" /> {location}
          </p>
        )}

        {(h.numberOfBeds || h.numberOfDoctors) && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            {h.numberOfBeds ? (
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5 text-brand-500" /> {h.numberOfBeds} beds
              </span>
            ) : null}
            {h.numberOfDoctors ? (
              <span className="inline-flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-brand-500" /> {h.numberOfDoctors}+ doctors
              </span>
            ) : null}
          </div>
        )}

        {depts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {depts.slice(0, 3).map((d) => (
              <span key={d} className="tag">{d}</span>
            ))}
            {depts.length > 3 && (
              <span className="tag bg-slate-100 text-ink-muted dark:bg-white/[0.06]">
                +{depts.length - 3}
              </span>
            )}
          </div>
        )}

        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-brand-600 dark:text-brand-300">
          View hospital
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
