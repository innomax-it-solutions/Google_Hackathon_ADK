/**
 * services/api.js — Single source of truth for all backend communication.
 *
 * The UI calls sendMessage(). Everything else is wiring.
 * Swap the base URL or path to point at any SSE-streaming AI backend.
 */

const BASE = import.meta.env.VITE_API_URL || "";

/**
 * Open an SSE stream to any POST endpoint.
 * Returns { abort } — call abort() to cancel.
 */
function ssePost(path, body, handlers) {
  const ctrl = new AbortController();

  (async () => {
    let res;
    try {
      res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } catch (err) {
      if (err.name !== "AbortError") handlers.onError?.(err.message || "Network error — please check your connection.");
      return;
    }

    if (!res.ok) {
      handlers.onError?.(`Request failed (${res.status}). Please try again.`);
      return;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop();
        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          let evt;
          try { evt = JSON.parse(line.slice(5).trim()); } catch { continue; }
          switch (evt.type) {
            case "session":     handlers.onSession?.(evt.session_id); break;
            case "token":       handlers.onToken?.(evt.text);         break;
            case "tool_call":   handlers.onToolCall?.(evt.name, evt.args);    break;
            case "tool_result": handlers.onToolResult?.(evt.name, evt.response); break;
            case "done":        handlers.onDone?.();                  break;
            case "error":       handlers.onError?.(evt.message);      break;
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") handlers.onError?.(err.message || "Stream interrupted.");
    } finally {
      reader.releaseLock();
    }
  })();

  return { abort: () => ctrl.abort() };
}

/**
 * Send a message to an existing (or new) session via POST /chat.
 * session_id is generated client-side on first call; backend creates the session.
 */
export function sendChatMessage(sessionId, message, handlers) {
  return ssePost("/chat", { session_id: sessionId, message }, handlers);
}
