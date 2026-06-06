import { Link } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
import Reveal from "../ui/Reveal";

export default function CTABanner() {
  return (
    <section className="section-pad">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 px-6 py-16 text-center shadow-glow sm:px-12 sm:py-20">
            {/* decorative grid + blobs */}
            <div className="pointer-events-none absolute inset-0 bg-grid-light bg-grid opacity-10" />
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-accent-300/20 blur-3xl" />

            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-[2.7rem]">
                Your treatment journey starts with one intelligent agent
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
                Find the right hospital, understand your costs, and get a complete,
                guided plan — in seconds, not weeks.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/chat"
                  className="btn bg-white text-brand-700 shadow-lg hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#hospitals"
                  className="btn border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <Building2 className="h-4 w-4" /> Explore Hospitals
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
