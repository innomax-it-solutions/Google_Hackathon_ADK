import { motion } from "framer-motion";
import { Cpu, ArrowRight, ArrowDown } from "lucide-react";
import Icon from "../ui/Icon";
import SectionHeading from "../ui/SectionHeading";
import { staggerContainer, staggerItem } from "../ui/Reveal";
import Reveal from "../ui/Reveal";
import { ARCHITECTURE } from "../../data/landingData";

function FlowNode({ node, index }) {
  return (
    <motion.div variants={staggerItem} className="flex flex-col items-center text-center">
      <div className="glass card-hover flex w-full max-w-[15rem] flex-col items-center rounded-3xl p-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-glow">
          <Icon name={node.icon} className="h-6 w-6" />
        </span>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-brand-600">
          Layer {index + 1}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold text-ink">{node.title}</h3>
        <p className="text-xs font-medium text-ink-muted">{node.subtitle}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{node.description}</p>
      </div>
    </motion.div>
  );
}

export default function Architecture() {
  return (
    <section
      id="technology"
      className="section-pad relative overflow-hidden bg-slate-950 text-white"
    >
      {/* dark grid backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-grid [mask-image:radial-gradient(70%_60%_at_50%_40%,#000,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />

      <div className="container-x relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow border-white/10 bg-white/5 text-brand-300">
            <Cpu className="h-3.5 w-3.5" /> Technology
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Built on a modern agentic architecture
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
            A reasoning agent orchestrates specialised tools to build each patient's plan.
            This is a visual representation of the platform's design.
          </p>
        </div>

        {/* Flow: Frontend -> ADK Agent -> MCP Tools */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16 flex flex-col items-center justify-center gap-5 lg:flex-row lg:gap-3"
        >
          {ARCHITECTURE.flow.map((node, i) => (
            <div key={node.title} className="flex flex-col items-center gap-5 lg:flex-row lg:gap-3">
              <FlowNode node={node} index={i} />
              {i < ARCHITECTURE.flow.length - 1 && (
                <motion.span variants={staggerItem} className="text-brand-400">
                  <ArrowDown className="h-6 w-6 lg:hidden" />
                  <ArrowRight className="hidden h-6 w-6 lg:block" />
                </motion.span>
              )}
            </div>
          ))}
        </motion.div>

        {/* MCP Tools */}
        <Reveal className="mt-14">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            MCP Tools the agent orchestrates
          </p>
          <div className="mx-auto mt-5 grid max-w-4xl gap-4 sm:grid-cols-3">
            {ARCHITECTURE.tools.map((tool) => (
              <div
                key={tool.title}
                className="glass-dark rounded-2xl p-5 transition-colors hover:border-brand-400/30"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand-300">
                  <Icon name={tool.icon} className="h-5 w-5" />
                </span>
                <h4 className="mt-3 text-sm font-semibold text-white">{tool.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Tech stack badges */}
        <Reveal className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {ARCHITECTURE.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300"
            >
              {tech}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
