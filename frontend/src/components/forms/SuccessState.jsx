import { Link } from "react-router-dom";
import { CheckCircle2, Sparkles } from "lucide-react";

/**
 * Post-submit confirmation shown inside the form card. UI-only — nothing was
 * sent to a server; this just acknowledges the (client-side) submission.
 */
export default function SuccessState({ title = "Thank you!", message, onReset, resetLabel = "Submit another response" }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">{title}</h2>
      {message && <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{message}</p>}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link to="/chat" className="btn-primary">
          <Sparkles className="h-4 w-4" /> Plan with Healtour AI
        </Link>
        {onReset && (
          <button type="button" onClick={onReset} className="btn-secondary">
            {resetLabel}
          </button>
        )}
      </div>
    </div>
  );
}
