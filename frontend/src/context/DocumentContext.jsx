/**
 * context/DocumentContext.jsx — medical-report analysis state for the side panel.
 *
 * The chat composer attaches reports as usual; on send it calls analyze(file)
 * here. We POST the file to the backend's Gemini-powered /analyze_report and keep
 * the result so the Report tab can render it on the right of the chat. Kept
 * separate from ChatContext so that file stays focused on the conversation.
 */

import { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import { analyzeReport } from "../services/api";

const Ctx = createContext(null);

// File types we send for analysis (medical reports). Other attachments are
// still shown in the chat bubble but are not analysed.
export function isAnalyzable(file) {
  const t = (file?.type || "").toLowerCase();
  return t.startsWith("image/") || t === "application/pdf";
}

export function DocumentProvider({ children }) {
  const [analyses, setAnalyses] = useState([]);   // newest last
  const [status, setStatus] = useState("idle");    // idle | analyzing | error
  const [error, setError] = useState(null);
  const [activeFile, setActiveFile] = useState(null); // {name} currently analysing
  const abortRef = useRef(null);

  const analyze = useCallback(async (file) => {
    if (!isAnalyzable(file)) return null;
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("analyzing");
    setError(null);
    setActiveFile({ name: file.name, type: file.type, size: file.size });
    try {
      const result = await analyzeReport(file, controller.signal);
      if (result?.status === "error") {
        setStatus("error");
        setError(result.message || "Couldn't analyse this report.");
        return result;
      }
      const entry = { ...result, fileName: file.name };
      setAnalyses((prev) => [...prev, entry]);
      setStatus("idle");
      setActiveFile(null);
      return entry;
    } catch (err) {
      if (controller.signal.aborted) return null;
      setStatus("error");
      setError(err?.message || "Couldn't reach the analysis service.");
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort?.();
    setAnalyses([]);
    setStatus("idle");
    setError(null);
    setActiveFile(null);
  }, []);

  const value = useMemo(() => ({
    analyses,
    latest: analyses.length ? analyses[analyses.length - 1] : null,
    status,
    error,
    activeFile,
    analyze,
    clear,
  }), [analyses, status, error, activeFile, analyze, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDocuments() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDocuments must be used inside <DocumentProvider>");
  return ctx;
}
