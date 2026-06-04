/**
 * context/ChatContext.jsx — Global chat state shared across the whole app.
 *
 * Provides:
 *   messages, sessionId, isStreaming
 *   sendMessage(text, attachments?)
 *   stopStream()
 *   clearConversation()
 *   regenerate()          — resend the last user message
 *   pendingClarification  — { fields } when the agent asked for missing details, else null
 *   submitClarification(answers) — compose the answers into a message and send
 *   dismissClarification()
 */

import { createContext, useContext, useState, useCallback } from "react";
import { useMessages }  from "../hooks/useChat";
import { useStreaming }  from "../hooks/useStreaming";
import { useLanguage }   from "./LanguageContext";
import { COUNTRIES }     from "../constants/countries";
import { CLARIFY_ORDER } from "../constants/clarify";
import { languageName, languageCode } from "../constants/languages";

const Ctx = createContext(null);
const COUNTRY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));

// Always collect these via the popup (the agent tends to forget the optional ones).
// Includes the travel/flight inputs so the whole journey is captured in one popup.
const ALWAYS_ASK = [
  "budget_usd", "timeline_weeks", "interpreter_language",
  "departure_city", "travel_date", "travellers",
];

// Build the full, ordered question set: whatever the agent flagged as missing PLUS
// the optional fields we always want, deduped and in canonical order.
function expandFields(agentFields) {
  const set = new Set([...(agentFields || []), ...ALWAYS_ASK]);
  return CLARIFY_ORDER.filter((f) => set.has(f));
}

// Turn the popup answers into a natural follow-up message for the agent.
function composeClarifyMessage(answers) {
  const parts = [];
  if (answers.condition)      parts.push(`I need ${answers.condition}.`);
  if (answers.origin_country) parts.push(`I'm travelling from ${COUNTRY_NAME[answers.origin_country] || answers.origin_country}.`);
  if (answers.budget_usd)     parts.push(`My budget is about $${answers.budget_usd}.`);
  if (answers.timeline_weeks) parts.push(`I'd like treatment within ${answers.timeline_weeks} weeks.`);
  if (answers.interpreter_language) parts.push(`I need an interpreter in ${languageName(answers.interpreter_language)}.`);
  if (answers.departure_city) parts.push(`I'll be flying from ${answers.departure_city}.`);
  if (answers.travel_date)    parts.push(`I plan to travel ${answers.travel_date}.`);
  if (answers.travellers)     parts.push(`Travelling party: ${answers.travellers} ${answers.travellers === "1" ? "person" : "people"}.`);
  return parts.join(" ") || "Here are my details.";
}

export function ChatProvider({ children }) {
  const { messages, sessionId, add, patch, patchFn, clear, popLast } = useMessages();
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingClarification, setPendingClarification] = useState(null);
  const { language } = useLanguage();

  // The streaming hook surfaces an ask_patient_details tool call here.
  const { send, stop } = useStreaming({
    sessionId, add, patch, patchFn,
    onClarify: (fields) => setPendingClarification({ fields: expandFields(fields) }),
  });

  // ── send ────────────────────────────────────────────────────────────────────
  // supportLanguage (optional ISO code) seeds the assistant message so the card can
  // show interpreter availability deterministically, without waiting on the agent.
  const sendMessage = useCallback((text, attachments = [], supportLanguage = "") => {
    const t = text.trim();
    if (!t || isStreaming) return;

    setPendingClarification(null);
    add({ role: "user", content: t, status: "complete", attachments });
    setIsStreaming(true);
    send(t, language, () => setIsStreaming(false), supportLanguage);
  }, [isStreaming, add, send, language]);

  // ── stop ────────────────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    stop();
    setIsStreaming(false);
  }, [stop]);

  // ── clear ───────────────────────────────────────────────────────────────────
  const clearConversation = useCallback(() => {
    stop();
    setIsStreaming(false);
    setPendingClarification(null);
    clear();
  }, [stop, clear]);

  // ── regenerate last response ─────────────────────────────────────────────────
  const regenerate = useCallback(() => {
    if (isStreaming) return;
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    popLast();                           // remove last assistant message
    setIsStreaming(true);
    send(lastUser.content, language, () => setIsStreaming(false));
  }, [isStreaming, messages, popLast, send, language]);

  // ── clarification popup ───────────────────────────────────────────────────────
  const submitClarification = useCallback((answers) => {
    setPendingClarification(null);
    const interpCode = languageCode(answers.interpreter_language);
    const normalized = { ...answers, interpreter_language: interpCode };
    sendMessage(composeClarifyMessage(normalized), [], interpCode);
  }, [sendMessage]);

  const dismissClarification = useCallback(() => setPendingClarification(null), []);

  return (
    <Ctx.Provider value={{
      messages, sessionId, isStreaming, sendMessage, stopStream, clearConversation, regenerate,
      pendingClarification, submitClarification, dismissClarification,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChatContext must be used inside <ChatProvider>");
  return ctx;
}
