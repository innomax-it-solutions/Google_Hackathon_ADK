/**
 * hooks/useStreaming.js — Manages a single active SSE stream.
 * Completely decoupled from UI — calls message state callbacks.
 */

import { useRef, useCallback } from "react";
import { sendChatMessage } from "../services/api";
import { friendlyError }   from "../services/ai/errors";

export function useStreaming({ sessionId, add, patch, patchFn, onClarify }) {
  const ctrlRef     = useRef(null);
  const streamIdRef = useRef(null);

  const send = useCallback((text, language, onDone, supportLanguage = "") => {
    // Cancel any in-flight stream before starting a new one
    ctrlRef.current?.abort();

    // Seed the chosen interpreter language so the card shows availability even if the
    // agent doesn't echo it back via find_hospitals.
    const initialIntake = supportLanguage ? { support_language: supportLanguage } : null;
    const id = add({ role: "assistant", content: "", status: "streaming", tools: [], toolData: {}, intake: initialIntake });
    streamIdRef.current = id;

    ctrlRef.current = sendChatMessage(sessionId, text, language, {
      onToken: (token) => {
        patchFn(id, m => ({ ...m, content: m.content + token }));
      },
      onToolCall: (name, args) => {
        // The agent asks for missing details via a popup instead of prose — surface
        // it to ChatContext and don't render it as a normal tool badge.
        if (name === "ask_patient_details") {
          onClarify?.(Array.isArray(args?.missing_fields) ? args.missing_fields : []);
          return;
        }
        patchFn(id, m => {
          const next = { ...m, tools: [...m.tools, { name, status: "running" }] };
          // The find_hospitals call carries the patient profile the agent parsed
          // from free text — reuse it as the Journey Plan card's header.
          if (name === "find_hospitals" && args) {
            next.intake = {
              ...(m.intake || {}),
              condition:      args.condition,
              origin_country: args.origin_country,
              budget_usd:     args.budget_usd,
              timeline_weeks: args.timeline_weeks,
            };
          }
          return next;
        });
      },
      onToolResult: (name, response) => {
        patchFn(id, m => ({
          ...m,
          tools: m.tools.map(t =>
            t.name === name && t.status === "running" ? { ...t, status: "done" } : t
          ),
          // Keep the raw tool payloads, keyed by tool name, so MessageBubble can
          // render them as Venkat's structured JourneyPlanCard.
          toolData: { ...m.toolData, [name]: response },
        }));
      },
      onDone: () => {
        patch(id, { status: "complete" });
        onDone?.();
      },
      onError: (err) => {
        // err = { code, status?, message } — see services/ai/errors.js
        const message = friendlyError(err?.code) ?? err?.message ?? "Something went wrong. Please try again.";
        if (err?.code !== "CANCELLED") {
          console.error("[MedBridge]", err);
        }
        patch(id, { status: "error", content: message });
        onDone?.();
      },
    });

    return id;
  }, [sessionId, add, patch, patchFn, onClarify]);

  const stop = useCallback(() => {
    ctrlRef.current?.abort();
    if (streamIdRef.current) {
      patch(streamIdRef.current, { status: "complete" });
    }
  }, [patch]);

  return { send, stop };
}
