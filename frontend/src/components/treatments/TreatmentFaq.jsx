import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-slate-200/70 dark:border-white/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-ink sm:text-base">{q}</span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm leading-relaxed text-ink-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** TreatmentFaq — accordion list. First item starts open. */
export default function TreatmentFaq({ faqs }) {
  const [openIdx, setOpenIdx] = useState(0);
  if (!faqs?.length) return null;

  return (
    <div className="divide-y divide-transparent">
      {faqs.map((f, i) => (
        <FaqItem
          key={f.q}
          q={f.q}
          a={f.a}
          open={openIdx === i}
          onToggle={() => setOpenIdx((cur) => (cur === i ? -1 : i))}
        />
      ))}
    </div>
  );
}
