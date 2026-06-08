/**
 * hooks/useSpeechRecognition.js — Browser speech-to-text for the composer.
 *
 * Thin wrapper over the Web Speech API (window.SpeechRecognition /
 * webkitSpeechRecognition). It only produces *text* — the transcript is fed
 * back to the caller, which drops it into the message box for review before
 * sending. There is no audio upload and no backend involvement; recognition
 * runs entirely in the browser (Chrome/Edge route it to Google's servers).
 *
 * Decoupled from UI, like useStreaming: the caller owns the text state and
 * supplies callbacks. We expose:
 *   supported  - whether the browser provides the API at all (Firefox: no)
 *   listening  - mic is currently active
 *   start()    - begin a recognition session
 *   stop()     - end it
 *
 * Callbacks (via opts):
 *   onInterim(text) - live, not-yet-final partial for the current phrase
 *   onFinal(text)   - a committed phrase (engine is confident)
 *   onError(code)   - lifecycle error, e.g. "not-allowed" (permission denied)
 *
 * `lang` is a BCP-47 tag derived from the active UI language (see LANG_TO_BCP47).
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Map the app's ISO 639-1 UI codes (LanguageContext LANGUAGES) to the BCP-47
 * locale tags the speech engine expects. Recognition-specific, so it lives here
 * rather than in constants/languages.js.
 */
const LANG_TO_BCP47 = {
  en: "en-US",
  zh: "zh-CN",
  hi: "hi-IN",
  es: "es-ES",
  fr: "fr-FR",
  ar: "ar-SA",
  bn: "bn-IN",
  pt: "pt-BR",
  ru: "ru-RU",
  ur: "ur-PK",
};

/** Best-effort BCP-47 tag for an ISO 639-1 code, defaulting to en-US. */
export function bcp47(code) {
  return LANG_TO_BCP47[code] || "en-US";
}

const SpeechRecognitionClass =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

export function useSpeechRecognition({ lang = "en", onInterim, onFinal, onError } = {}) {
  const supported = Boolean(SpeechRecognitionClass);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  // Keep the latest callbacks in refs so the recognition instance (created once)
  // always calls through to current handlers without being torn down on every
  // render.
  const handlersRef = useRef({ onInterim, onFinal, onError });
  useEffect(() => {
    handlersRef.current = { onInterim, onFinal, onError };
  }, [onInterim, onFinal, onError]);

  // Create the recognition instance once; re-create only if the browser support
  // status changes (effectively never after mount).
  useEffect(() => {
    if (!supported) return undefined;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          handlersRef.current.onFinal?.(transcript);
        } else {
          interim += transcript;
        }
      }
      if (interim) handlersRef.current.onInterim?.(interim);
    };

    recognition.onerror = (event) => {
      setListening(false);
      handlersRef.current.onError?.(event.error);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      try {
        recognition.abort();
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null;
    };
  }, [supported]);

  // Keep the recognition locale in sync with the active UI language.
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = bcp47(lang);
    }
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listening) return;
    recognition.lang = bcp47(lang);
    try {
      recognition.start();
    } catch {
      // start() throws if called while already starting — ignore, onstart/onend
      // keep `listening` authoritative.
    }
  }, [lang, listening]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, listening, start, stop };
}
