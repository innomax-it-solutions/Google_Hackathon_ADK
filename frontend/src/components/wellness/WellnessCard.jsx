import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import MediaImage from "../content/MediaImage";
import { gradientFor, priceInfo } from "./wellnessMeta";

/** WellnessCard — wellness package summary linking to its detail page. */
export default function WellnessCard({ pkg }) {
  const w = pkg;
  const src = w.photo ? `/uploads/${w.photo}` : null;
  const price = priceInfo(w);

  return (
    <Link
      to={`/wellness/${w.slug}`}
      className="card card-hover group flex h-full flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <MediaImage src={src} alt={w.name} gradient={gradientFor(w.name)} icon="Leaf" label={w.name} />
        <div className="absolute left-3 top-3 flex gap-2">
          {w.isNew && (
            <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white">New</span>
          )}
          {price?.discount > 0 && (
            <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white">
              {price.discount}% off
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold leading-snug text-ink line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300">
          {w.name}
        </h3>
        {w.shortDescription && (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted line-clamp-2">{w.shortDescription}</p>
        )}
        {w.location && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <MapPin className="h-3.5 w-3.5 text-brand-500" /> {w.location}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {price ? (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-ink">{price.finalLabel}</span>
              {price.discount > 0 && (
                <span className="text-xs text-ink-muted line-through">{price.originalLabel}</span>
              )}
            </div>
          ) : <span />}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-300">
            View <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
