import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Icon from "../ui/Icon";
import { deptIcon } from "../treatments/treatmentMeta";

/** SpecialtyCard — specialty (department) summary linking to its detail hub. */
export default function SpecialtyCard({ specialty }) {
  const s = specialty;
  return (
    <Link
      to={`/specialties/${s.slug}`}
      className="card card-hover group flex h-full items-start gap-4 p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300">
        <Icon name={deptIcon(s.name)} className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-base font-bold text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300">
          {s.name}
        </h3>
        {s.description && (
          <p className="mt-1 text-sm leading-relaxed text-ink-muted line-clamp-2">{s.description}</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
          Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
