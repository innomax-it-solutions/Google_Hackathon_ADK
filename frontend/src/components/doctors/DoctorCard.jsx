import { Link } from "react-router-dom";
import { Building2, Clock, ArrowRight } from "lucide-react";
import { docInitials, deptGradient } from "./doctorMeta";

/**
 * DoctorCard — directory card linking to the doctor's profile. No doctor photos
 * are bundled, so a gradient monogram avatar is used. Works in both the doctors
 * grid and the hospital detail page.
 */
export default function DoctorCard({ doctor }) {
  const d = doctor;
  const department = d.departments?.[0];

  return (
    <Link
      to={`/doctors/${d.slug}`}
      className="card card-hover group flex h-full flex-col p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-center gap-3.5">
        <span className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${deptGradient(d.name)} font-display text-base font-extrabold text-white`}>
          {docInitials(d.name)}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300">
            {d.name}
          </h3>
          {d.designation && (
            <p className="line-clamp-2 text-xs leading-snug text-ink-muted">{d.designation}</p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-ink-muted">
        {d.experience && (
          <p className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-brand-500" /> {d.experience} experience
          </p>
        )}
        {d.hospital && (
          <p className="flex items-start gap-1.5">
            <Building2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-500" />
            <span className="line-clamp-1">{d.hospital}</span>
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        {department ? <span className="tag">{department}</span> : <span />}
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-300">
          Profile
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
