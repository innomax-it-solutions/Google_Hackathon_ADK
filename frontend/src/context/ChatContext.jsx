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
import { COUNTRIES }     from "../constants/countries";
import { CLARIFY_ORDER } from "../constants/clarify";
import { languageName, languageCode } from "../constants/languages";

const Ctx = createContext(null);
const COUNTRY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));

// Always collect these via the popup (the agent tends to forget the optional ones).
// Includes the travel/flight inputs so the whole journey is captured in one popup.
// Respect the agent's judgment: it has already parsed the patient's message and
// passes ONLY the fields the patient hasn't provided yet. We just keep that list
// deduped and in canonical question order — we do NOT re-add fields the patient
// already answered (that was the old bug: a full prompt still got asked everything).
function expandFields(agentFields) {
  const set = new Set(agentFields || []);
  return CLARIFY_ORDER.filter((f) => set.has(f));
}

// Turn the popup answers into a natural follow-up message for the agent.
function composeClarifyMessage(answers) {
  const parts = [];
  if (answers.condition)      parts.push(`I need ${answers.condition}.`);
  if (answers.origin_country) parts.push(`I'm travelling from ${COUNTRY_NAME[answers.origin_country] || answers.origin_country}.`);
  if (answers.budget_usd)     parts.push(`My budget is about $${answers.budget_usd}.`);
  if (answers.timeline_weeks) parts.push(`I'd like treatment within ${answers.timeline_weeks} weeks.`);
  // Interpreter is optional: if the question was answered (key present) but the
  // value is empty ("No, English is fine"), say so EXPLICITLY — otherwise the
  // agent never learns it's settled and re-asks at the end.
  if ("interpreter_language" in answers) {
    parts.push(answers.interpreter_language
      ? `I need an interpreter in ${languageName(answers.interpreter_language)}.`
      : `I don't need an interpreter — English is fine.`);
  }
  if (answers.departure_city) parts.push(`I'll be flying from ${answers.departure_city}.`);
  if (answers.travel_date)    parts.push(`I plan to travel ${answers.travel_date}.`);
  if (answers.travellers)     parts.push(`Travelling party: ${answers.travellers} ${answers.travellers === "1" ? "person" : "people"}.`);
  return parts.join(" ") || "Here are my details.";
}

export function ChatProvider({ children }) {
  const { messages, sessionId, add, patch, patchFn, clear, popLast } = useMessages();
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingClarification, setPendingClarification] = useState(null);

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
    // Pass "" as the reply language so the agent mirrors the user's own language
    // (typed or dictated) — replies always match what the user actually wrote.
    // We deliberately don't force the persisted UI language: that made a single
    // Arabic voice message pin every later reply (and new chats) to Arabic.
    send(t, "", () => setIsStreaming(false), supportLanguage);
  }, [isStreaming, add, send]);

  // ── stop ────────────────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    stop();
    setIsStreaming(false);
  }, [stop]);

  // ── start a FRESH conversation seeded with one message ───────────────────────
  // Used by the Wishlist page ("Chat with agent" / "Confirm booking"): clears any
  // current conversation, then sends the seed so the agent rebuilds the plan in
  // chat. `clear` + `add` both use functional setState, so the seed appends to the
  // freshly-emptied list.
  const startCardConversation = useCallback((text) => {
    const t = (text || "").trim();
    if (!t) return;
    stop();
    setPendingClarification(null);
    clear();
    add({ role: "user", content: t, status: "complete" });
    setIsStreaming(true);
    // Pass "" so the agent mirrors the seed's language (English), matching sendMessage.
    send(t, "", () => setIsStreaming(false));
  }, [stop, clear, add, send]);

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
    send(lastUser.content, "", () => setIsStreaming(false));
  }, [isStreaming, messages, popLast, send]);

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
      startCardConversation,
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
