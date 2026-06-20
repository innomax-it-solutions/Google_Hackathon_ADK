import { Link } from "react-router-dom";
import { Clock, BedDouble, ArrowRight } from "lucide-react";
import MediaImage from "../content/MediaImage";
import { deptIcon, deptGradient, durationLabel, stayLabel } from "./treatmentMeta";

/**
 * TreatmentCard — compact treatment summary used in grids. Shows the treatment
 * photo when available, falling back to a specialty-coloured gradient with the
 * department icon (consistent with the hospital/partner visuals).
 */
export default function TreatmentCard({ treatment }) {
  const t = treatment;
  const duration = durationLabel(t);
  const stay = stayLabel(t);
  const src = t.photo ? `/uploads/${t.photo}` : null;

  return (
    <Link
      to={`/treatments/${t.slug}`}
      className="card card-hover group flex h-full flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <MediaImage src={src} alt={t.name} gradient={deptGradient(t.department)} icon={deptIcon(t.department)} label={t.name} />
        {t.department && (
          <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
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
