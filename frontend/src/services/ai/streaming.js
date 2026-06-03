/**
 * SSE streaming engine for the MedBridge backend protocol.
 *
 * Event wire format (one per `data:` line):
 *   { type: "session",     session_id: string }
 *   { type: "token",       text: string }
 *   { type: "tool_call",   name: string, args: object }
 *   { type: "tool_result", name: string, response: object }
 *   { type: "done" }
 *   { type: "error",       message: string }
 *
 * Handlers:
 *   onSession(sessionId)
 *   onToken(text)
 *   onToolCall(name, args)
 *   onToolResult(name, response)
 *   onDone()
 *   onError({ code, status?, message })
 */

import { classifyStatus } from "./errors";

/**
 * Open a POST-based SSE stream.
 * @returns {{ abort: () => void }}
 */
export function openSseStream(url, body, handlers) {
  const ctrl = new AbortController();

  (async () => {
    // ── Fetch ──────────────────────────────────────────────────────────────
    let res;
    try {
      res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
        signal:  ctrl.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") return;
      handlers.onError?.({ code: "NETWORK", message: err.message });
      return;
    }

    if (!res.ok) {
      handlers.onError?.({ code: classifyStatus(res.status), status: res.status });
      return;
    }

    // ── Stream ─────────────────────────────────────────────────────────────
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });

        // SSE blocks are delimited by double-newline
        const blocks = buf.split("\n\n");
        buf = blocks.pop(); // last element may be incomplete — keep buffered

        for (const block of blocks) {
          const line = block.trim();
          if (!line.startsWith("data:")) continue;

          let evt;
          try { evt = JSON.parse(line.slice(5).trim()); } catch { continue; }

          dispatch(evt, handlers);
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        handlers.onError?.({ code: "STREAM", message: err.message });
      }
    } finally {
      reader.releaseLock();
    }
  })();

  return { abort: () => ctrl.abort() };
}

function dispatch(evt, handlers) {
  switch (evt.type) {
    case "session":     handlers.onSession?.(evt.session_id);               break;
    case "token":       handlers.onToken?.(evt.text);                       break;
    case "tool_call":   handlers.onToolCall?.(evt.name, evt.args);          break;
    case "tool_result": handlers.onToolResult?.(evt.name, evt.response);    break;
    case "done":        handlers.onDone?.();                                 break;
    case "error":       handlers.onError?.({ code: "SERVER", message: evt.message }); break;
    // Unknown event types are silently ignored — forward-compatible
  }
}
