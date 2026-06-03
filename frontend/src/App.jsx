import { useState, useRef } from "react";
import IntakeForm from "./IntakeForm";

/**
 * App — root component.
 *
 * Owns the shared stream state and wires IntakeForm -> JourneyPlanCard.
 * JourneyPlanCard (Venkat) will replace the placeholder below.
 */
export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [streamedText, setStreamedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolEvents, setToolEvents] = useState([]); // { type, name, payload }
  const [error, setError] = useState(null);
  const [hasResult, setHasResult] = useState(false);

  function handleLoadingStart() {
    setStreamedText("");
    setToolEvents([]);
    setError(null);
    setHasResult(false);
    setIsLoading(true);
  }

  function handleToken(text) {
    setStreamedText((prev) => prev + text);
  }

  function handleToolCall(name, args) {
    setToolEvents((prev) => [...prev, { type: "call", name, payload: args }]);
  }

  function handleToolResult(name, response) {
    setToolEvents((prev) => [...prev, { type: "result", name, payload: response }]);
  }

  function handleDone() {
    setIsLoading(false);
    setHasResult(true);
  }

  function handleError(message) {
    setIsLoading(false);
    setError(message);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight">
            MedBridge
          </h1>
          <p className="mt-2 text-slate-600 text-base">
            AI-powered medical tourism coordinator — your journey to India, planned in seconds.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Intake Form */}
          <div className="w-full lg:w-auto lg:flex-shrink-0">
            <IntakeForm
              onLoadingStart={handleLoadingStart}
              onSession={setSessionId}
              onToken={handleToken}
              onToolCall={handleToolCall}
              onToolResult={handleToolResult}
              onDone={handleDone}
              onError={handleError}
            />
          </div>

          {/* Result area — replace with <JourneyPlanCard /> (Venkat) */}
          {(isLoading || hasResult || error) && (
            <div className="flex-1 w-full">
              {error ? (
                <ErrorCard message={error} />
              ) : (
                <JourneyPlanPlaceholder
                  isLoading={isLoading}
                  text={streamedText}
                  toolEvents={toolEvents}
                  sessionId={sessionId}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Temporary placeholder — swap for Venkat's JourneyPlanCard */
function JourneyPlanPlaceholder({ isLoading, text, toolEvents, sessionId }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Tool activity indicator */}
      {toolEvents.length > 0 && (
        <div className="mb-4 space-y-1">
          {toolEvents.map((ev, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
              {ev.type === "call" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Running <strong>{ev.name}</strong>...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span><strong>{ev.name}</strong> done</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skeleton while no text yet */}
      {isLoading && !text && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-4/5" />
        </div>
      )}

      {/* Streamed text */}
      {text && (
        <div className="prose prose-slate prose-sm max-w-none whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
          {text}
          {isLoading && (
            <span className="inline-block w-1.5 h-4 bg-blue-500 ml-0.5 animate-pulse align-text-bottom" />
          )}
        </div>
      )}

      {sessionId && (
        <p className="mt-4 text-xs text-slate-400">Session: {sessionId}</p>
      )}
    </div>
  );
}

function ErrorCard({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
      <h3 className="font-semibold text-red-700 mb-1">Something went wrong</h3>
      <p className="text-sm text-red-600">{message}</p>
      <p className="mt-3 text-xs text-red-500">
        Please try again or contact support if the issue persists.
      </p>
    </div>
  );
}
