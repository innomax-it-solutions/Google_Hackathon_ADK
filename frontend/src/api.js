/**
 * api.js — SSE client for the MedBridge backend.
 *
 * Uses fetch + ReadableStream (not EventSource) because EventSource only
 * supports GET, but POST /run is how the backend accepts intake data.
 *
 * SSE event types emitted by the backend (main.py):
 *   session    { session_id }
 *   token      { text }
 *   tool_call  { name, args }
 *   tool_result{ name, response }
 *   done       {}
 *   error      { message }
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Submit intake form and stream the Journey Plan.
 *
 * @param {Object} intakeData  - { condition, origin_country, budget_usd, timeline_weeks, session_id? }
 * @param {Object} callbacks   - { onSession, onToken, onToolCall, onToolResult, onDone, onError }
 * @returns {{ abort: () => void }}  Call abort() to cancel the stream.
 */
export function postIntake(intakeData, callbacks) {
  const controller = new AbortController();

  (async () => {
    let response;
    try {
      response = await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intakeData),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") return;
      callbacks.onError?.(err.message || "Network error — could not reach the server.");
      return;
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      callbacks.onError?.(`Server error ${response.status}: ${text}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE lines are separated by \n\n; each event starts with "data: "
        const parts = buffer.split("\n\n");
        buffer = parts.pop(); // keep the incomplete tail

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;

          const raw = line.slice("data:".length).trim();
          let event;
          try {
            event = JSON.parse(raw);
          } catch {
            continue; // malformed line — skip
          }

          switch (event.type) {
            case "session":
              callbacks.onSession?.(event.session_id);
              break;
            case "token":
              callbacks.onToken?.(event.text);
              break;
            case "tool_call":
              callbacks.onToolCall?.(event.name, event.args);
              break;
            case "tool_result":
              callbacks.onToolResult?.(event.name, event.response);
              break;
            case "done":
              callbacks.onDone?.();
              break;
            case "error":
              callbacks.onError?.(event.message);
              break;
            default:
              break;
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        callbacks.onError?.(err.message || "Stream read error.");
      }
    } finally {
      reader.releaseLock();
    }
  })();

  return { abort: () => controller.abort() };
}

/**
 * Send a follow-up message on an existing session.
 *
 * @param {string} sessionId
 * @param {string} message
 * @param {Object} callbacks  - same shape as postIntake callbacks
 * @returns {{ abort: () => void }}
 */
export function postChat(sessionId, message, callbacks) {
  const controller = new AbortController();

  (async () => {
    let response;
    try {
      response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") return;
      callbacks.onError?.(err.message || "Network error.");
      return;
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      callbacks.onError?.(`Server error ${response.status}: ${text}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const raw = line.slice("data:".length).trim();
          let event;
          try {
            event = JSON.parse(raw);
          } catch {
            continue;
          }

          switch (event.type) {
            case "session":
              callbacks.onSession?.(event.session_id);
              break;
            case "token":
              callbacks.onToken?.(event.text);
              break;
            case "tool_call":
              callbacks.onToolCall?.(event.name, event.args);
              break;
            case "tool_result":
              callbacks.onToolResult?.(event.name, event.response);
              break;
            case "done":
              callbacks.onDone?.();
              break;
            case "error":
              callbacks.onError?.(event.message);
              break;
            default:
              break;
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        callbacks.onError?.(err.message || "Stream read error.");
      }
    } finally {
      reader.releaseLock();
    }
  })();

  return { abort: () => controller.abort() };
}
