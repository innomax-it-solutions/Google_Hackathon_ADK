// Shimmer placeholder shown while a lazy-loaded section's chunk is fetched.
// Mirrors the rough shape of a section (heading + card grid) to reduce layout shift.
export default function SectionSkeleton({ cards = 3 }) {
  return (
    <div className="section-pad" aria-hidden="true">
      <div className="container-x">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-9 w-3/4" />
          <div className="skeleton h-4 w-2/3" />
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-12 w-12 rounded-2xl" />
              <div className="skeleton mt-5 h-5 w-2/3" />
              <div className="skeleton mt-3 h-4 w-full" />
              <div className="skeleton mt-2 h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
