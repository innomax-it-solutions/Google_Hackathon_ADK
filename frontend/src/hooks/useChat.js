/**
 * hooks/useChat.js — Message state + localStorage persistence.
 * Pure state management — knows nothing about the network.
 */

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "medbridge_chat_v3";
let _seq = Date.now();
const uid = () => ++_seq;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore parse errors */ }
  return null;
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore quota errors */ }
}

export function useMessages() {
  const [messages, setMessages] = useState(() => load()?.messages ?? []);
  const [sessionId] = useState(() => load()?.sessionId ?? crypto.randomUUID().replace(/-/g, ""));

  // Persist on every change
  useEffect(() => {
    save({ sessionId, messages });
  }, [messages, sessionId]);

  const add = useCallback((msg) => {
    const full = { id: uid(), ts: new Date().toISOString(), tools: [], ...msg };
    setMessages(prev => [...prev, full]);
    return full.id;
  }, []);

  const patch = useCallback((id, delta) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...delta } : m));
  }, []);

  const patchFn = useCallback((id, fn) => {
    setMessages(prev => prev.map(m => m.id === id ? fn(m) : m));
  }, []);

  const clear = useCallback(() => setMessages([]), []);

  // Remove the last assistant message (used by regenerate)
  const popLast = useCallback(() => {
    setMessages(prev => {
      const idx = [...prev].reverse().findIndex(m => m.role === "assistant");
      if (idx === -1) return prev;
      const real = prev.length - 1 - idx;
      return prev.filter((_, i) => i !== real);
    });
  }, []);

  return { messages, sessionId, add, patch, patchFn, clear, popLast };
}
