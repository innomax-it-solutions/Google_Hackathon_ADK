/**
 * ReportPanel — medical-report analysis (Report tab).
 *
 * Renders the latest Gemini analysis as an interactive, card-based dashboard:
 * a condition hero with quick stats, a summary, colour-coded abnormal values,
 * collapsible findings, and a checkable next-steps list. The "Plan my journey
 * for this" CTA seeds a fresh agent conversation. Decision-support only.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDocuments }   from "../../context/DocumentContext";
import { useChatContext } from "../../context/ChatContext";
import { useProfile }     from "../../context/ProfileContext";
import { useToast }       from "../../context/ToastContext";
import { Button }         from "../ui/button";
import { COUNTRIES }      from "../../constants/countries";
import { languageName }   from "../../constants/languages";
import { profileToIntake } from "../../utils/profile";

const COUNTRY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));

/* ── helpers ──────────────────────────────────────────────────────────────── */

// Compose a natural, journey-planning seed message from the analysis + profile.
function buildSeed(analysis, profile) {
  const intake = profileToIntake(profile, analysis);
  const focus = analysis.condition || analysis.summary || "the condition in my medical report";
  const parts = [`I have a medical report indicating ${focus}.`];
  if (intake.origin_country) parts.push(`I'm travelling from ${COUNTRY_NAME[intake.origin_country] || intake.origin_country}.`);
  if (intake.departure_city) parts.push(`I'll be flying from ${intake.departure_city}.`);
  if (intake.interpreter_language) parts.push(`I'd like an interpreter in ${languageName(intake.interpreter_language)}.`);
  if (intake.travellers) parts.push(`Travelling party: ${intake.travellers}.`);
  parts.push("Please plan my medical journey to India and show me the full Journey Plan.");
  return parts.join(" ");
}

// Split "Name: 182 mg/dL (< 100) - HIGH" into a label, detail and severity.
function parseAbnormal(raw) {
  const str = String(raw || "");
  const isLow  = /\b(low|decreased|below|deficien)/i.test(str);
  const isHigh = /\b(high|elevated|increased|above|critical|positive)/i.test(str);
  const severity = isHigh ? "high" : isLow ? "low" : "flag";
  const idx = str.indexOf(":");
  const label  = idx !== -1 ? str.slice(0, idx).trim() : str;
  const detail = idx !== -1 ? str.slice(idx + 1).trim() : "";
  return { label, detail, severity };
}

const SEV = {
  high: { dot: "bg-red-500",   chip: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900", label: "HIGH" },
  low:  { dot: "bg-amber-500", chip: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900", label: "LOW" },
  flag: { dot: "bg-amber-500", chip: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900", label: "FLAG" },
};

const fade = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
};

/* ── sub-components ───────────────────────────────────────────────────────── */

function StatChip({ value, label, tone = "default" }) {
  const tones = {
    default: "text-[var(--color-text-primary)]",
    danger:  "text-red-500",
    accent:  "text-[var(--color-accent)]",
  };
  return (
    <div className="flex-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-2.5 py-2 text-center">
      <div className={`text-[17px] font-bold leading-none ${tones[tone]}`}>{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">{label}</div>
    </div>
  );
}

function Section({ icon, title, count, accent, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!children) return null;
  return (
    <motion.div variants={fade} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-[var(--color-surface-2)] transition-colors"
      >
        <span className={accent}>{icon}</span>
        <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{title}</span>
        {count != null && (
          <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-surface-2)] text-[10.5px] font-semibold leading-[18px] text-center text-[var(--color-text-secondary)]">
            {count}
          </span>
        )}
        <ChevronIcon className={`ml-auto w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="px-4 pb-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NextSteps({ items }) {
  const [done, setDone] = useState({});
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => {
        const checked = !!done[i];
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
              className="w-full flex items-start gap-2.5 text-left group"
            >
              <span className={`mt-0.5 flex-shrink-0 h-[18px] w-[18px] rounded-md border flex items-center justify-center transition-colors ${
                checked
                  ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                  : "border-[var(--color-border)] group-hover:border-[var(--color-accent-muted)]"
              }`}>
                {checked && <CheckIcon className="w-3 h-3 text-white" />}
              </span>
              <span className={`text-[13px] leading-snug ${checked ? "line-through text-[var(--color-text-tertiary)]" : "text-[var(--color-text-primary)]"}`}>
                {it}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ── main ─────────────────────────────────────────────────────────────────── */

export default function ReportPanel({ onPlanned }) {
  const { latest, status, error, activeFile, analyses } = useDocuments();
  const { startCardConversation } = useChatContext();
  const { profile } = useProfile();
  const { toast } = useToast();

  function planJourney() {
    if (!latest) return;
    startCardConversation(buildSeed(latest, profile));
    onPlanned?.();
  }

  function copySummary() {
    if (!latest?.summary) return;
    navigator.clipboard?.writeText(latest.summary).then(
      () => toast({ title: "Summary copied", variant: "success" }),
      () => toast({ title: "Couldn't copy", variant: "error" })
    );
  }

  // ── analyzing ──────────────────────────────────────────────────────────────
  if (status === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
        <div className="relative h-12 w-12">
          <span className="absolute inset-0 rounded-full border-2 border-[var(--color-accent-muted)]" />
          <Spinner className="absolute inset-0 m-auto w-7 h-7 animate-spin text-[var(--color-accent)]" />
        </div>
        <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">
          Analysing{activeFile?.name ? ` ${activeFile.name}` : " your report"}…
        </p>
        <p className="text-[11.5px] text-[var(--color-text-tertiary)]">Extracting condition, findings &amp; next steps.</p>
      </div>
    );
  }

  // ── error ──────────────────────────────────────────────────────────────────
  if (status === "error" && !latest) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-2">
        <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
          <WarnIcon className="w-6 h-6 text-amber-500" />
        </div>
        <p className="text-[13px] text-[var(--color-text-secondary)]">{error || "Couldn't analyse that file."}</p>
        <p className="text-[11.5px] text-[var(--color-text-tertiary)]">Attach a PDF or image of a medical report in the chat to try again.</p>
      </div>
    );
  }

  // ── empty ──────────────────────────────────────────────────────────────────
  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
          <DocIcon className="w-7 h-7 text-[var(--color-text-tertiary)]" />
        </div>
        <p className="text-[13.5px] font-medium text-[var(--color-text-secondary)]">No report analysed yet</p>
        <p className="text-[12.5px] text-[var(--color-text-tertiary)] leading-relaxed max-w-[260px]">
          Attach a medical report (PDF or image) using the 📎 button in the chat. Its AI analysis
          will appear here as an interactive summary.
        </p>
      </div>
    );
  }

  // ── result ─────────────────────────────────────────────────────────────────
  const abnormal = (latest.abnormal_values || []).map(parseAbnormal);

  return (
    <div className="flex flex-col h-full">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-3"
      >

        {/* Hero — condition + quick stats */}
        <motion.div
          variants={fade}
          className="rounded-2xl border border-[var(--color-accent-muted)] bg-gradient-to-br from-[var(--color-accent-subtle)] to-transparent p-4"
        >
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)] mb-2">
            <DocIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{latest.fileName}</span>
            {latest.report_type && latest.report_type !== "other" && (
              <span className="ml-auto rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide">
                {latest.report_type}
              </span>
            )}
          </div>

          <h3 className="text-[16px] font-bold text-[var(--color-text-primary)] leading-snug">
            {latest.condition || "Report analysed"}
          </h3>
          {latest.specialty && (
            <span className="inline-flex items-center gap-1 mt-2 rounded-full bg-[var(--color-accent)] text-white px-2.5 py-0.5 text-[11.5px] font-medium">
              <PulseIcon className="w-3 h-3" />
              {latest.specialty}
            </span>
          )}

          <div className="flex gap-2 mt-3.5">
            <StatChip value={abnormal.length} label="Flagged" tone={abnormal.length ? "danger" : "default"} />
            <StatChip value={(latest.key_findings || []).length} label="Findings" tone="accent" />
            <StatChip value={(latest.recommended_next_steps || []).length} label="Steps" />
          </div>
        </motion.div>

        {/* Summary */}
        {latest.summary && (
          <motion.div variants={fade} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Summary</span>
              <button onClick={copySummary} aria-label="Copy summary" className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors">
                <CopyIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">{latest.summary}</p>
          </motion.div>
        )}

        {/* Abnormal values — colour-coded */}
        {abnormal.length > 0 && (
          <Section
            icon={<AlertIcon className="w-4 h-4" />}
            title="Abnormal values"
            count={abnormal.length}
            accent="text-red-500"
          >
            <div className="space-y-1.5">
              {abnormal.map((a, i) => {
                const sev = SEV[a.severity];
                return (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${sev.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-medium text-[var(--color-text-primary)] truncate">{a.label}</p>
                      {a.detail && <p className="text-[11.5px] text-[var(--color-text-tertiary)] truncate">{a.detail}</p>}
                    </div>
                    <span className={`flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${sev.chip}`}>{sev.label}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Key findings */}
        {(latest.key_findings || []).length > 0 && (
          <Section
            icon={<ListIcon className="w-4 h-4" />}
            title="Key findings"
            count={latest.key_findings.length}
            accent="text-[var(--color-accent)]"
          >
            <ul className="space-y-1.5">
              {latest.key_findings.map((f, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-[var(--color-text-primary)] leading-snug">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Recommended next steps — interactive checklist */}
        {(latest.recommended_next_steps || []).length > 0 && (
          <Section
            icon={<CheckCircleIcon className="w-4 h-4" />}
            title="Recommended next steps"
            count={latest.recommended_next_steps.length}
            accent="text-emerald-500"
          >
            <NextSteps items={latest.recommended_next_steps} />
          </Section>
        )}

        {/* Disclaimer */}
        {latest.disclaimer && (
          <motion.p variants={fade} className="text-[11px] text-[var(--color-text-tertiary)] italic leading-relaxed px-1">
            {latest.disclaimer}
          </motion.p>
        )}

        {analyses.length > 1 && (
          <p className="text-[11px] text-[var(--color-text-tertiary)] px-1">{analyses.length} reports analysed this session.</p>
        )}
      </motion.div>

      {/* CTA */}
      <div className="flex-shrink-0 border-t border-[var(--color-border)] px-4 py-3 bg-[var(--color-bg)]">
        <Button variant="gradient" size="lg" onClick={planJourney} className="w-full gap-1.5">
          <PlaneIcon className="w-4 h-4" />
          Plan my journey for this
        </Button>
      </div>
    </div>
  );
}

/* ── Icons ── */
const Spinner = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth={2} d="M12 3a9 9 0 109 9" /></svg>;
const DocIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" /></svg>;
const WarnIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>;
const ChevronIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const CheckIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
const CheckCircleIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AlertIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>;
const ListIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const CopyIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const PulseIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h4l2 5 4-12 2 7h6" /></svg>;
const PlaneIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L11 19v-5.5l10 2.5z" /></svg>;
