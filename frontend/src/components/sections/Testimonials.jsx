import { motion } from "framer-motion";
import { Quote, Star, MessageSquareHeart } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";
import { staggerContainer, staggerItem } from "../ui/Reveal";
import { TESTIMONIALS } from "../../data/landingData";

function TestimonialCard({ t }) {
  return (
    <motion.figure
      variants={staggerItem}
      className="card card-hover flex h-full flex-col p-6"
    >
      <Quote className="h-7 w-7 text-brand-200 dark:text-brand-500/40" />
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
        “{t.quote}”
      </blockquote>

      <div className="mt-5 flex items-center gap-1 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
        ))}
      </div>

      <figcaption className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-sm font-bold text-white`}
        >
          {t.initials}
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink">{t.name}</p>
          <p className="text-xs text-ink-muted">
            {t.country} · {t.treatment}
          </p>
        </div>
      </figcaption>
    </motion.figure>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="section-pad bg-slate-50/70 dark:bg-slate-900/30">
      <div className="container-x">
        <SectionHeading
          eyebrow="Patient Stories"
          icon={<MessageSquareHeart className="h-3.5 w-3.5" />}
          title="Trusted by patients around the world"
          subtitle="International patients who planned their treatment journey with MVT Bridge."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
