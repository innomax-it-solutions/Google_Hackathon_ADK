import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Icon from "../ui/Icon";
import SectionHeading from "../ui/SectionHeading";
import { staggerContainer, staggerItem } from "../ui/Reveal";
import { AI_FEATURES } from "../../data/landingData";

function FeatureCard({ feature }) {
  return (
    <motion.div variants={staggerItem} className="group relative h-full">
      {/* glow on hover */}
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-brand-500/0 via-brand-500/0 to-accent-500/0 opacity-0 blur transition duration-500 group-hover:from-brand-500/30 group-hover:to-accent-500/30 group-hover:opacity-100" />

      <div className="relative flex h-full flex-col rounded-3xl border border-slate-200/70 bg-white p-6 shadow-soft transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-brand-200/70 group-hover:shadow-card dark:border-white/[0.07] dark:bg-slate-900 dark:shadow-none dark:group-hover:border-brand-400/25">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 text-brand-600 ring-1 ring-brand-100/60 transition-colors group-hover:from-brand-600 group-hover:to-accent-500 group-hover:text-white dark:from-brand-500/15 dark:to-accent-500/15 dark:text-brand-300 dark:ring-brand-400/20">
          <Icon name={feature.icon} className="h-6 w-6" />
        </span>
        <h3 className="mt-5 font-display text-lg font-bold text-ink">{feature.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.description}</p>
      </div>
    </motion.div>
  );
}

export default function AIFeatures() {
  return (
    <section id="features" className="section-pad">
      <div className="container-x">
        <SectionHeading
          eyebrow="AI Capabilities"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          title="Intelligence at every step of the journey"
          subtitle="Purpose-built AI features that turn a complex, stressful process into a guided, transparent experience."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {AI_FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
