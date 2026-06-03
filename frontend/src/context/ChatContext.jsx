/**
 * context/ChatContext.jsx — Global chat state shared across the whole app.
 *
 * Provides:
 *   messages, sessionId, isStreaming
 *   sendMessage(text, attachments?)
 *   stopStream()
 *   clearConversation()
 *   regenerate()          — resend the last user message
 */

import { createContext, useContext, useState, useCallback } from "react";
import { useMessages }  from "../hooks/useChat";
import { useStreaming }  from "../hooks/useStreaming";

const Ctx = createContext(null);

export function ChatProvider({ children }) {
  const { messages, sessionId, add, patch, patchFn, clear, popLast } = useMessages();
  const [isStreaming, setIsStreaming] = useState(false);

  const { send, stop } = useStreaming({ sessionId, add, patch, patchFn });

  // ── send ────────────────────────────────────────────────────────────────────
  const sendMessage = useCallback((text, attachments = []) => {
    const t = text.trim();
    if (!t || isStreaming) return;

    add({ role: "user", content: t, status: "complete", attachments });
    setIsStreaming(true);
    send(t, () => setIsStreaming(false));
  }, [isStreaming, add, send]);

  // ── stop ────────────────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    stop();
    setIsStreaming(false);
  }, [stop]);

  // ── clear ───────────────────────────────────────────────────────────────────
  const clearConversation = useCallback(() => {
    stop();
    setIsStreaming(false);
    clear();
  }, [stop, clear]);

  // ── regenerate last response ─────────────────────────────────────────────────
  const regenerate = useCallback(() => {
    if (isStreaming) return;
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    popLast();                           // remove last assistant message
    setIsStreaming(true);
    send(lastUser.content, () => setIsStreaming(false));
  }, [isStreaming, messages, popLast, send]);

  return (
    <Ctx.Provider value={{ messages, sessionId, isStreaming, sendMessage, stopStream, clearConversation, regenerate }}>
      {children}
    </Ctx.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChatContext must be used inside <ChatProvider>");
  return ctx;
}
