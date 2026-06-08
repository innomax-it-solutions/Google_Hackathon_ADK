/**
 * hooks/useVoiceDictation.js — Live voice dictation over a WebSocket.
 *
 * Captures the mic as raw 16 kHz mono PCM (via the pcm-recorder AudioWorklet)
 * and streams it to the backend's /ws/transcribe, which proxies to Google Cloud
 * Speech-to-Text v2 (Chirp). Transcript events stream back in real time:
 * interim partials update live as you speak, finals commit. STT also detects the
 * spoken language, so the caller can switch the agent's reply language to match.
 *
 * Decoupled from UI, like useStreaming: the caller owns the text state and
 * supplies callbacks. We expose:
 *   supported    - browser can capture + stream audio
 *   recording    - mic live, streaming
 *   transcribing - stopped, draining final results before the socket closes
 *   start()      - begin a session
 *   stop()       - end mic capture (server finalizes, then closes)
 *
 * Callbacks (via opts):
 *   onInterim(text)          - live, evolving partial for the current phrase
 *   onResult(text, language) - a committed final phrase + detected ISO 639-1 code
 *   onError(code)            - "not-allowed" | "mic-error" | "socket-error" | server message
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { transcribeSocketUrl } from "../services/api";

const WORKLET_URL = "/pcm-recorder.worklet.js";

export function useVoiceDictation({ onInterim, onResult, onError } = {}) {
  const supported =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof AudioContext !== "undefined" &&
    typeof WebSocket !== "undefined";

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const wsRef = useRef(null);
  const ctxRef = useRef(null);
  const streamRef = useRef(null);
  const nodeRef = useRef(null);

  // Latest callbacks in a ref so the socket/worklet handlers always call current
  // handlers without being re-bound on every render.
  const handlersRef = useRef({ onInterim, onResult, onError });
  useEffect(() => {
    handlersRef.current = { onInterim, onResult, onError };
  }, [onInterim, onResult, onError]);

  // Tear down the audio graph + mic. Leaves the socket alone (it closes itself
  // after the server flushes final results).
  const teardownAudio = useCallback(() => {
    if (nodeRef.current) {
      nodeRef.current.port.onmessage = null;
      nodeRef.current.disconnect();
      nodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (!recording) return;
    setRecording(false);
    setTranscribing(true);
    // Tell the server we're done; it finalizes, sends final events, then closes.
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send("stop");
      } catch {
        /* socket already closing */
      }
    }
    teardownAudio();
  }, [recording, teardownAudio]);

  const start = useCallback(async () => {
    if (!supported || recording) return;

    // 1) Open the transcript socket first so config/audio aren't lost.
    let ws;
    try {
      ws = new WebSocket(transcribeSocketUrl());
      ws.binaryType = "arraybuffer";
    } catch {
      handlersRef.current.onError?.("socket-error");
      return;
    }
    wsRef.current = ws;

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === "interim") handlersRef.current.onInterim?.(data.text);
      else if (data.type === "final")
        handlersRef.current.onResult?.(data.text, data.language);
      else if (data.type === "error")
        handlersRef.current.onError?.(data.message || "socket-error");
    };
    ws.onerror = () => handlersRef.current.onError?.("socket-error");
    ws.onclose = () => {
      setRecording(false);
      setTranscribing(false);
      wsRef.current = null;
    };

    // 2) Acquire the mic + build the PCM capture graph.
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      try {
        ws.close();
      } catch {
        /* noop */
      }
      handlersRef.current.onError?.(
        err?.name === "NotAllowedError" ? "not-allowed" : "mic-error",
      );
      return;
    }
    streamRef.current = stream;

    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      await ctx.audioWorklet.addModule(WORKLET_URL);
      const source = ctx.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(ctx, "pcm-recorder");
      nodeRef.current = node;

      node.port.onmessage = (event) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(event.data); // ArrayBuffer
      };
      // Connect through to destination so the graph pulls; the worklet emits
      // silence on its output, so there's no mic echo.
      source.connect(node);
      node.connect(ctx.destination);

      setRecording(true);
    } catch {
      teardownAudio();
      try {
        ws.close();
      } catch {
        /* noop */
      }
      handlersRef.current.onError?.("mic-error");
    }
  }, [supported, recording, teardownAudio]);

  // Clean up if the component unmounts mid-session.
  useEffect(
    () => () => {
      teardownAudio();
      const ws = wsRef.current;
      if (ws) {
        try {
          ws.close();
        } catch {
          /* noop */
        }
      }
    },
    [teardownAudio],
  );

  return { supported, recording, transcribing, start, stop };
}
