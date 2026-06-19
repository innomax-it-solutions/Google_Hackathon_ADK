import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";
import Icon from "../ui/Icon";

/**
 * Shared chrome for the UI-only lead pages: navbar, header, a two-column body
 * (form card + sidebar), and footer. `icon` is an Icon-map name.
 */
export default function LeadPageLayout({ eyebrow, icon, title, intro, children, sidebar }) {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="pt-28 sm:pt-32">
        <section className="border-b border-slate-200/70 bg-surface-2/40 dark:border-slate-800/70">
          <div className="container-x py-10 sm:py-14">
            <span className="eyebrow"><Icon name={icon} className="h-3.5 w-3.5" /> {eyebrow}</span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
            {intro && <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">{intro}</p>}
          </div>
        </section>

        <section className="container-x py-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
            <div className="card p-6 sm:p-8">{children}</div>
            <aside className="space-y-6">{sidebar}</aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
