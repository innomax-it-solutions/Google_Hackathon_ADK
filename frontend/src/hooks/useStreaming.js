/**
 * hooks/useStreaming.js — Manages a single active SSE stream.
 * Completely decoupled from UI — calls message state callbacks.
 */

import { useRef, useCallback } from "react";
import { sendChatMessage } from "../services/api";
import { friendlyError }   from "../services/ai/errors";

export function useStreaming({ sessionId, add, patch, patchFn }) {
  const ctrlRef     = useRef(null);
  const streamIdRef = useRef(null);

  const send = useCallback((text, onDone) => {
    // Cancel any in-flight stream before starting a new one
    ctrlRef.current?.abort();

    const id = add({ role: "assistant", content: "", status: "streaming", tools: [] });
    streamIdRef.current = id;

    ctrlRef.current = sendChatMessage(sessionId, text, {
      onToken: (token) => {
        patchFn(id, m => ({ ...m, content: m.content + token }));
      },
      onToolCall: (name) => {
        patchFn(id, m => ({ ...m, tools: [...m.tools, { name, status: "running" }] }));
      },
      onToolResult: (name) => {
        patchFn(id, m => ({
          ...m,
          tools: m.tools.map(t =>
            t.name === name && t.status === "running" ? { ...t, status: "done" } : t
          ),
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
  }, [sessionId, add, patch, patchFn]);

  const stop = useCallback(() => {
    ctrlRef.current?.abort();
    if (streamIdRef.current) {
      patch(streamIdRef.current, { status: "complete" });
    }
  }, [patch]);

  return { send, stop };
}
