import { SearchX } from "lucide-react";
import Reveal from "../ui/Reveal";
import HospitalCard from "./HospitalCard";

/** HospitalGrid — responsive grid of HospitalCards with an empty state. */
export default function HospitalGrid({ hospitals, emptyMessage = "No hospitals found.", animate = true }) {
  if (!hospitals?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 py-20 text-center dark:border-white/10">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-ink-muted dark:bg-white/[0.06]">
          <SearchX className="h-6 w-6" />
        </span>
        <p className="mt-4 text-sm font-medium text-ink-soft">{emptyMessage}</p>
        <p className="mt-1 text-sm text-ink-muted">Try a different search term or city.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {hospitals.map((h, i) =>
        animate ? (
          <Reveal key={h.slug || h.id} delay={Math.min(i, 8) * 0.04}>
            <HospitalCard hospital={h} />
          </Reveal>
        ) : (
          <HospitalCard key={h.slug || h.id} hospital={h} />
        ),
      )}
    </div>
  );
}
