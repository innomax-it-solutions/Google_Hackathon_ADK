import { useState } from "react";
import { motion } from "framer-motion";
import { useChatContext } from "../../context/ChatContext";
import { useLanguage }    from "../../context/LanguageContext";
import { Button }  from "../ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge }   from "../ui/badge";

/* ── Animations ─────────────────────────────────────────────────────────── */

// Time-of-day greeting key, resolved to the active language via t("greeting.*").
function greetingKey() {
  const h = new Date().getHours();
  if (h < 5)  return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
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
  const { t }           = useLanguage();

  const promptCards  = t("prompts.cards");
  const quickActions = t("prompts.quickActions");

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
            {t(`greeting.${greetingKey()}`)}
          </h1>
          <p className="mt-1.5 text-[16px] font-medium text-[var(--color-text-secondary)]">
            {t("hero.subtitle")}
          </p>
          <p className="mt-2.5 text-[13.5px] text-[var(--color-text-tertiary)] leading-relaxed max-w-sm mx-auto">
            {t("hero.description")}
          </p>
        </motion.div>

        {/* Prompt cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
        >
          {promptCards.map(p => (
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
          {quickActions.map(a => (
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
