import Reveal from "../ui/Reveal";
import Icon from "../ui/Icon";
import { ABOUT_HEALTOUR } from "../../data/landingData";

function AboutVisual() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 shadow-soft dark:border-white/[0.07]">
      <img
        src="/about-healtour.jpg"
        alt="A globe surrounded by a stethoscope, representing global medical tourism and international healthcare"
        className="aspect-[4/3] h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export default function AboutHealtour() {
  return (
    <section id="about" className="section-pad bg-surface-2/50">
      <div className="container-x">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <AboutVisual />
          </Reveal>

          <div>
            <Reveal>
              <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                About <span className="text-brand-600 dark:text-brand-400">MVT Bridge</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink-muted sm:text-lg">
                {ABOUT_HEALTOUR.description}
              </p>
              <p className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {ABOUT_HEALTOUR.ecosystem}
              </p>
            </Reveal>

            <div className="mt-10 grid gap-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {ABOUT_HEALTOUR.highlights.map((item, i) => (
                <Reveal key={item.title} delay={0.05 * i}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      <Icon name={item.icon} className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
