/**
 * hooks/useStreaming.js — Manages a single active SSE stream.
 * Completely decoupled from UI — calls message callbacks.
 */

import { useRef, useCallback } from "react";
import { sendChatMessage } from "../services/api";

export function useStreaming({ sessionId, add, patch, patchFn }) {
  const ctrlRef    = useRef(null);  // AbortController wrapper
  const streamIdRef = useRef(null); // id of the currently-streaming message

  /**
   * Send a message, create a streaming assistant bubble, and fill it with tokens.
   * Returns the message id of the assistant bubble.
   */
  const send = useCallback((text, onDone) => {
    // Cancel any in-flight stream
    ctrlRef.current?.abort();

    // Create the empty streaming bubble
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
        console.error("[MedBridge stream]", err);
        patch(id, {
          status: "error",
          content: "Something went wrong. Please try again.",
        });
        onDone?.();
      },
    });

    return id;
  }, [sessionId, add, patch, patchFn]);

  /** Cancel the current stream and mark the bubble as complete. */
  const stop = useCallback(() => {
    ctrlRef.current?.abort();
    if (streamIdRef.current) {
      patch(streamIdRef.current, { status: "complete" });
    }
  }, [patch]);

  return { send, stop };
}
