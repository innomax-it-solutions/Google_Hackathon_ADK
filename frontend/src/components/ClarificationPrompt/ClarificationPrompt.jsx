/**
 * ClarificationPrompt — a multi-step question card shown above the composer when the
 * agent calls ask_patient_details. Collects the missing intake details (one question
 * at a time, with suggested options + a free-text "Something else" + Skip) and hands
 * the answers back so a complete message can be sent.
 *
 * Props:
 *   fields      - ordered list of field keys to ask (subset of CLARIFY_FIELDS)
 *   onComplete  - (answers) => void   when the last step is done
 *   onDismiss   - () => void          close without answering
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CLARIFY_FIELDS, CLARIFY_ORDER } from "../../constants/clarify";

export default function ClarificationPrompt({ fields, onComplete, onDismiss }) {
  // Keep only known fields, in canonical order.
  const steps = useMemo(
    () => CLARIFY_ORDER.filter((f) => fields?.includes(f) && CLARIFY_FIELDS[f]),
    [fields]
  );

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const inputRef = useRef(null);

  const field = steps[step];
  const cfg = field ? CLARIFY_FIELDS[field] : null;
  const total = steps.length;

  useEffect(() => {
    // Reset per-step transient input when the step changes.
    setCustomOpen(false);
    setCustomText("");
  }, [step]);

  useEffect(() => {
    if (customOpen) inputRef.current?.focus();
  }, [customOpen]);

  if (!cfg) return null;

  function commit(value) {
    const next = value === undefined ? answers : { ...answers, [field]: value };
    if (value !== undefined) setAnswers(next);
    if (step < total - 1) setStep(step + 1);
    else onComplete(next);
  }

  function chooseOption(v) { commit(v); }
  function skip()          { commit(undefined); }
  function submitCustom() {
    const v = customText.trim();
    if (!v) return;
    commit(v);
  }

  // Number-key shortcuts (1–9) select an option, like the reference design.
  function onKeyDown(e) {
    if (customOpen) return;
    const n = parseInt(e.key, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= cfg.options.length) {
      e.preventDefault();
      chooseOption(cfg.options[n - 1].value);
    }
  }

  return (
    <div className="flex-shrink-0 px-3 sm:px-6 pb-1 pt-1">
      <div className="max-w-[64rem] mx-auto" onKeyDown={onKeyDown}>
        <AnimatePresence mode="wait">
          <motion.div
            key={field}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-dropdown overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
              <p className="text-[14px] font-semibold text-[var(--color-text-primary)] truncate">
                {cfg.question}
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0 text-[var(--color-text-tertiary)]">
                <button
                  onClick={() => step > 0 && setStep(step - 1)}
                  disabled={step === 0}
                  className="p-1 rounded-md hover:bg-[var(--color-surface-2)] disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous"
                >
                  <Chevron dir="left" />
                </button>
                <span className="text-[12px] tabular-nums select-none">{step + 1} of {total}</span>
                <button
                  onClick={() => step < total - 1 && setStep(step + 1)}
                  disabled={step === total - 1}
                  className="p-1 rounded-md hover:bg-[var(--color-surface-2)] disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next"
                >
                  <Chevron dir="right" />
                </button>
                <button
                  onClick={onDismiss}
                  className="p-1 rounded-md hover:bg-[var(--color-surface-2)] ml-1"
                  aria-label="Close"
                >
                  <XIcon />
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="py-1.5">
              {cfg.options.map((opt, i) => {
                const selected = answers[field] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => chooseOption(opt.value)}
                    className={`group w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${selected ? "bg-[var(--color-accent-subtle)]" : "hover:bg-[var(--color-surface-2)]"}`}
                  >
                    <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md border border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                      {i + 1}
                    </span>
                    <span className={`flex-1 text-[14px] ${selected ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
                      {opt.label}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-tertiary)]">
                      <Arrow />
                    </span>
                  </button>
                );
              })}

              {/* Something else / Skip row */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--color-border-subtle)] mt-1">
                <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-tertiary)]">
                  <Pencil />
                </span>
                {customOpen ? (
                  <input
                    ref={inputRef}
                    type={cfg.custom.type === "number" ? "number" : "text"}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitCustom(); } }}
                    placeholder={cfg.custom.placeholder}
                    className="flex-1 bg-transparent text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setCustomOpen(true)}
                    className="flex-1 text-left text-[14px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                  >
                    Something else
                  </button>
                )}

                {customOpen ? (
                  <button
                    onClick={submitCustom}
                    disabled={!customText.trim()}
                    className="text-[12px] font-semibold px-3 py-1 rounded-lg bg-[var(--color-accent)] text-white disabled:opacity-40"
                  >
                    Send
                  </button>
                ) : (
                  cfg.optional && (
                    <button
                      onClick={skip}
                      className="text-[12px] font-medium px-3 py-1 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    >
                      Skip
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Icons ── */
const Chevron = ({ dir }) => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d={dir === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
  </svg>
);
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const Arrow = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const Pencil = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
