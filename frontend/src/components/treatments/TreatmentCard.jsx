import { Link } from "react-router-dom";
import { Clock, BedDouble, ArrowRight } from "lucide-react";
import Icon from "../ui/Icon";
import { deptIcon, deptGradient, durationLabel, stayLabel } from "./treatmentMeta";

/**
 * TreatmentCard — compact treatment summary used in grids. No external image
 * assets exist for treatments, so the header is a specialty-coloured gradient
 * with the department icon (consistent with the hospital/partner visuals).
 */
export default function TreatmentCard({ treatment }) {
  const t = treatment;
  const duration = durationLabel(t);
  const stay = stayLabel(t);

  return (
    <Link
      to={`/treatments/${t.slug}`}
      className="card card-hover group flex h-full flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className={`relative flex h-24 items-center justify-between bg-gradient-to-br ${deptGradient(t.department)} px-5`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
          <Icon name={deptIcon(t.department)} className="h-6 w-6" />
        </span>
        {t.department && (
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {t.department}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold leading-snug text-ink line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300">
          {t.name}
        </h3>
        {t.shortDescription && (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted line-clamp-3">
            {t.shortDescription}
          </p>
        )}

        <div className="mt-auto pt-4">
          {(duration || stay) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              {duration && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-brand-500" /> {duration}
                </span>
              )}
              {stay && (
                <span className="inline-flex items-center gap-1.5">
                  <BedDouble className="h-3.5 w-3.5 text-brand-500" /> {stay}
                </span>
              )}
            </div>
          )}
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
            View details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
