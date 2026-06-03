import { useState } from "react";
import { motion } from "framer-motion";
import { useChatContext } from "../../context/ChatContext";
import { Button }  from "../ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge }   from "../ui/badge";

/* ── Data ──────────────────────────────────────────────────────────────── */

const PROMPT_CARDS = [
  {
    icon: "🏥",
    title: "Find best hospitals",
    body: "Compare accredited facilities for your condition",
    preview: "What are the best hospitals in India for cardiac surgery?",
    prompt: "I need help planning a medical trip to India for knee replacement surgery. I'm from UAE and my budget is around $8,000.",
  },
  {
    icon: "💰",
    title: "Estimate treatment costs",
    body: "Compare India prices vs your home-country quote",
    preview: "How much does heart bypass surgery cost in India vs USA?",
    prompt: "Can you estimate the cost of heart bypass surgery in India? I'm from Nigeria and was quoted $40,000 locally.",
  },
  {
    icon: "🌍",
    title: "Visa & travel checklist",
    body: "Documents and processing time by nationality",
    preview: "What documents do I need for a medical visa to India?",
    prompt: "What visa and documents do I need to travel to India for medical treatment? I'm from Bangladesh.",
  },
  {
    icon: "📋",
    title: "Plan my medical trip",
    body: "Hospital match, costs, and visa — all in one plan",
    preview: "Help me plan a complete medical journey to India",
    prompt: "I need a complete plan for medical tourism to India. I need a kidney transplant, I'm from the UAE, and my budget is $25,000.",
  },
];

const QUICK_ACTIONS = [
  { label: "Find Hospitals",      prompt: "What are the best JCI-accredited hospitals in India for orthopedic surgery?" },
  { label: "Treatment Cost",      prompt: "How much does cardiac bypass surgery cost in India compared to the US?" },
  { label: "Visa Requirements",   prompt: "What visa do I need to travel to India for medical treatment?" },
  { label: "Plan My Trip",        prompt: "Help me plan a complete medical trip to India for liver transplant from Nigeria." },
  { label: "Compare Hospitals",   prompt: "Compare Apollo Hospitals, Fortis, and Medanta for cancer treatment." },
  { label: "Emergency Help",      prompt: "I need urgent medical assistance in India — what should I do?" },
];

/* ── Animations ─────────────────────────────────────────────────────────── */

function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Component ──────────────────────────────────────────────────────────── */

export default function SuggestedPrompts() {
  const { sendMessage } = useChatContext();

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-6 overflow-y-auto">
      <div className="w-full max-w-2xl">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-9"
        >
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>

          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[var(--color-text-primary)] leading-tight">
            {greeting()}
          </h1>
          <p className="mt-1.5 text-[16px] font-medium text-[var(--color-text-secondary)]">
            Your AI Medical Tourism Assistant
          </p>
          <p className="mt-2.5 text-[13.5px] text-[var(--color-text-tertiary)] leading-relaxed max-w-sm mx-auto">
            Find hospitals, compare treatment costs, understand visa requirements,
            and plan your complete medical journey to India.
          </p>
        </motion.div>

        {/* Prompt cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
        >
          {PROMPT_CARDS.map(p => (
            <PromptCard key={p.title} data={p} onSelect={() => sendMessage(p.prompt)} />
          ))}
        </motion.div>

        {/* Quick action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {QUICK_ACTIONS.map(a => (
            <Button
              key={a.label}
              variant="outline"
              size="sm"
              onClick={() => sendMessage(a.prompt)}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
            >
              {a.label}
            </Button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ── Prompt card ─────────────────────────────────────────────────────────── */

function PromptCard({ data, onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div variants={itemVariants}>
      <Card
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative overflow-hidden"
      >
        {/* Gradient accent on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-[var(--color-accent-subtle)] to-transparent pointer-events-none rounded-2xl" />

        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="text-[22px] leading-none mt-0.5 flex-shrink-0">{data.icon}</span>
            <div className="min-w-0 flex-1">
              <CardTitle className="group-hover:text-[var(--color-accent)] transition-colors duration-150">
                {data.title}
              </CardTitle>
              <CardDescription>{data.body}</CardDescription>

              {/* Preview — slides in on hover */}
              <motion.p
                initial={false}
                animate={{ height: hovered ? "auto" : 0, opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.18 }}
                className="text-[12px] text-[var(--color-accent)] mt-1.5 italic overflow-hidden leading-relaxed"
              >
                "{data.preview}"
              </motion.p>
            </div>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
}
