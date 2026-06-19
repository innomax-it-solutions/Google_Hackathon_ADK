import { Link } from "react-router-dom";
import { CalendarDays, Eye, ArrowRight } from "lucide-react";
import MediaImage from "./MediaImage";
import { gradientFor, formatDate, stripTags } from "./contentMeta";

/**
 * ArticleCard — shared card for blogs and patient stories (identical schema).
 * `basePath` is "/blog" or "/stories"; `assetDir`/`icon` differ per kind.
 */
export default function ArticleCard({ article, basePath, assetDir, icon = "FileText" }) {
  const a = article;
  const src = a.photo ? `/${assetDir}/${a.photo}` : null;
  const excerpt = stripTags(a.excerpt).slice(0, 160);

  return (
    <Link
      to={`${basePath}/${a.slug}`}
      className="card card-hover group flex h-full flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <MediaImage src={src} alt={a.title} gradient={gradientFor(a.category || a.title)} icon={icon} label={a.category} />
        {a.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {a.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold leading-snug text-ink line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300">
          {a.title}
        </h3>
        {excerpt && (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted line-clamp-3">{excerpt}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-4 text-xs text-ink-muted">
          {a.date && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-brand-500" /> {formatDate(a.date)}
            </span>
          )}
          {typeof a.views === "number" && (
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-brand-500" /> {a.views.toLocaleString()}
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-300">
            Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
