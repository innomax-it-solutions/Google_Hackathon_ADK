import { motion } from "framer-motion";
import { Workflow } from "lucide-react";
import Icon from "../ui/Icon";
import SectionHeading from "../ui/SectionHeading";
import { staggerContainer, staggerItem } from "../ui/Reveal";
import { HOW_IT_WORKS } from "../../data/landingData";

function StepCard({ item }) {
  return (
    <motion.div variants={staggerItem} className="relative">
      <div className="card card-hover group h-full p-6">
        {/* icon with animated pulse ring */}
        <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-glow">
          <span className="absolute inset-0 rounded-2xl bg-brand-500/40 animate-pulse-ring" />
          <Icon name={item.icon} className="relative h-5 w-5" />
        </span>

        <h3 className="relative mt-5 font-display text-lg font-bold text-ink">
          {item.title}
        </h3>
        <p className="relative mt-2 text-sm leading-relaxed text-ink-muted">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-pad bg-slate-50/70 dark:bg-slate-900/30">
      <div className="container-x">
        <SectionHeading
          eyebrow="How it Works"
          icon={<Workflow className="h-3.5 w-3.5" />}
          title="From request to journey plan in four steps"
          subtitle="The agent guides every patient through a clear, intelligent flow — no manual coordination required."
        />

        <div className="relative mt-16">
          {/* animated connector line (desktop) */}
          <div className="pointer-events-none absolute left-0 right-0 top-[2.1rem] hidden h-px overflow-hidden lg:block">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="h-full origin-left bg-gradient-to-r from-transparent via-brand-300 to-transparent dark:via-brand-500/40"
            />
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {HOW_IT_WORKS.map((item) => (
              <StepCard key={item.step} item={item} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
