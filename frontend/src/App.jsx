import { useState, useRef, useEffect } from "react";
import IntakeForm from "./IntakeForm";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [streamedText, setStreamedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasResult, setHasResult] = useState(false);

  function handleLoadingStart() {
    setStreamedText("");
    setError(null);
    setHasResult(false);
    setIsLoading(true);
  }

  function handleToken(text) {
    setStreamedText((prev) => prev + text);
  }

  function handleDone() {
    setIsLoading(false);
    setHasResult(true);
  }

  function handleError(message) {
    setIsLoading(false);
    setError(message);
  }

  function handleNewSearch() {
    setStreamedText("");
    setError(null);
    setHasResult(false);
    setSessionId(null);
  }

  const showPanel = isLoading || hasResult || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-800">MedBridge</span>
            <span className="hidden sm:inline text-xs text-slate-400 border border-slate-200 rounded-full px-2 py-0.5 ml-1">
              by Healtour Solutions
            </span>
          </div>
          <p className="hidden md:block text-sm text-slate-500">
            AI-powered medical tourism coordinator
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero */}
        {!showPanel && (
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
              World-class treatment in India.<br />
              <span className="text-blue-600">Planned in seconds.</span>
            </h1>
            <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
              Tell us your condition and budget. MedBridge finds the right hospital,
              estimates your costs, and prepares your visa checklist — instantly.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <Stat icon="🏥" label="22 accredited hospitals" />
              <Stat icon="💰" label="Save up to 80% vs Western prices" />
              <Stat icon="📋" label="Instant visa checklist" />
            </div>
          </div>
        )}

        <div className={`flex flex-col ${showPanel ? "lg:flex-row" : ""} gap-8 items-start justify-center`}>
          {/* Form */}
          <div className={`w-full ${showPanel ? "lg:w-[440px] lg:flex-shrink-0" : "max-w-lg mx-auto"}`}>
            <IntakeForm
              onLoadingStart={handleLoadingStart}
              onSession={setSessionId}
              onToken={handleToken}
              onToolCall={() => {}}
              onToolResult={() => {}}
              onDone={handleDone}
              onError={handleError}
            />
          </div>

          {/* Result panel */}
          {showPanel && (
            <div className="flex-1 w-full min-w-0">
              {error ? (
                <ErrorPanel message={error} onRetry={handleNewSearch} />
              ) : (
                <ResultPanel
                  isLoading={isLoading}
                  text={streamedText}
                  sessionId={sessionId}
                  hasResult={hasResult}
                  onNewSearch={handleNewSearch}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-16 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        MedBridge · Healtour Solutions · Cost estimates are indicative (June 2026 rates).
        Always confirm with the hospital before booking.
      </footer>
    </div>
  );
}

function Stat({ icon, label }) {
  return (
    <span className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm">
      <span>{icon}</span>
      {label}
    </span>
  );
}

// --- Result Panel ---

function ResultPanel({ isLoading, text, sessionId, hasResult, onNewSearch }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (text) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [text]);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-blue-500 animate-pulse" : "bg-green-500"}`} />
          <span className="text-sm font-semibold text-slate-700">
            {isLoading ? "Building your Journey Plan..." : "Your Journey Plan"}
          </span>
        </div>
        {hasResult && (
          <button
            onClick={onNewSearch}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            New search
          </button>
        )}
      </div>

      <div className="px-6 py-5">
        {/* Skeleton — shown while loading and no text yet */}
        {isLoading && !text && (
          <div className="space-y-3 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-2/3" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="mt-4 h-5 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-4/5" />
            <div className="mt-4 h-5 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-2/3" />
          </div>
        )}

        {/* Streamed markdown text */}
        {text && (
          <div className="text-sm text-slate-700 leading-relaxed">
            <MarkdownRenderer text={text} />
            {isLoading && (
              <span className="inline-block w-1.5 h-4 bg-blue-500 ml-0.5 animate-pulse align-text-bottom rounded-sm" />
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      {hasResult && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Estimates are indicative · June 2026 rates · Confirm details with the hospital before booking.
          </p>
          <button
            onClick={onNewSearch}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium
              px-4 py-2 rounded-lg transition"
          >
            Plan another journey
          </button>
        </div>
      )}
    </div>
  );
}

// Lightweight markdown renderer — handles the output format from the MedBridge agent
function MarkdownRenderer({ text }) {
  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-3" />;

        // ### Heading
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-base font-bold text-slate-800 mt-4 mb-1">
              {inlineParse(line.slice(4))}
            </h3>
          );
        }
        // ## Heading
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-lg font-bold text-slate-800 mt-5 mb-1 border-b border-slate-100 pb-1">
              {inlineParse(line.slice(3))}
            </h2>
          );
        }
        // # Heading
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-xl font-extrabold text-blue-700 mt-5 mb-2">
              {inlineParse(line.slice(2))}
            </h1>
          );
        }
        // - List item
        if (/^[-*] /.test(line)) {
          return (
            <div key={i} className="flex items-start gap-2 ml-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span>{inlineParse(line.slice(2))}</span>
            </div>
          );
        }
        // Numbered list
        if (/^\d+\. /.test(line)) {
          const [num, ...rest] = line.split(". ");
          return (
            <div key={i} className="flex items-start gap-2 ml-2">
              <span className="flex-shrink-0 w-5 h-5 text-xs font-bold text-blue-600 bg-blue-50 rounded-full flex items-center justify-center mt-0.5">
                {num}
              </span>
              <span>{inlineParse(rest.join(". "))}</span>
            </div>
          );
        }
        // Regular paragraph
        return <p key={i}>{inlineParse(line)}</p>;
      })}
    </div>
  );
}

// Parse inline **bold** and *italic*
function inlineParse(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index} className="font-semibold text-slate-900">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index}>{m[3]}</em>);
    else if (m[4]) parts.push(<code key={m.index} className="bg-slate-100 text-slate-700 px-1 rounded text-xs">{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

// --- Error Panel ---

function ErrorPanel({ message, onRetry }) {
  // Log the technical detail to the console for developers — never show it to the user
  console.error("[MedBridge] Stream error:", message);

  const isNetworkError = /network|fetch|failed to fetch|load/i.test(message);

  const title = isNetworkError
    ? "We couldn't connect to the service"
    : "We couldn't complete your request";

  const suggestion = isNetworkError
    ? "Please check your internet connection and try again."
    : "Our service ran into a problem. Please try again — it usually resolves on its own.";

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="font-semibold text-red-700 text-sm">{title}</span>
      </div>

      <div className="px-6 py-5 space-y-3">
        <p className="text-sm text-slate-600">{suggestion}</p>
        <p className="text-xs text-slate-400">
          If this keeps happening, please contact our support team and we'll sort it out for you.
        </p>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white
            font-medium rounded-lg transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
