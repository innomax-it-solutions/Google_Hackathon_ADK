import { useState, useRef } from "react";
import { postIntake } from "./api";
import { COUNTRIES } from "./constants/countries";

const INITIAL_FORM = {
  condition: "",
  origin_country: "",
  budget_usd: "",
  timeline_weeks: 6,
};

function validate(form) {
  const errors = {};
  if (!form.condition || form.condition.trim().length < 3) {
    errors.condition = "Please describe your condition (at least 3 characters).";
  }
  if (!form.origin_country) {
    errors.origin_country = "Please select your country.";
  }
  if (!form.budget_usd || Number(form.budget_usd) <= 0) {
    errors.budget_usd = "Please enter a budget greater than $0.";
  }
  if (!form.timeline_weeks || Number(form.timeline_weeks) < 1) {
    errors.timeline_weeks = "Timeline must be at least 1 week.";
  }
  return errors;
}

/**
 * IntakeForm — controlled 4-field intake form.
 *
 * Props:
 *   onLoadingStart()          called immediately on submit (show skeleton)
 *   onSession(sessionId)      called when the SSE session event arrives
 *   onToken(text)             called for each streamed text token
 *   onToolCall(name, args)    called when the agent invokes a tool
 *   onToolResult(name, resp)  called when a tool returns
 *   onDone()                  called when the stream ends successfully
 *   onError(message)          called on any error
 */
export default function IntakeForm({
  onLoadingStart,
  onSession,
  onToken,
  onToolCall,
  onToolResult,
  onDone,
  onError,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the error for that field as the user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    setIsLoading(true);
    setErrors({});
    onLoadingStart?.();

    const payload = {
      condition: form.condition.trim(),
      origin_country: form.origin_country,
      budget_usd: Number(form.budget_usd),
      timeline_weeks: Number(form.timeline_weeks),
    };

    abortRef.current = postIntake(payload, {
      onSession: (id) => onSession?.(id),
      onToken: (text) => onToken?.(text),
      onToolCall: (name, args) => onToolCall?.(name, args),
      onToolResult: (name, resp) => onToolResult?.(name, resp),
      onDone: () => {
        setIsLoading(false);
        onDone?.();
      },
      onError: (msg) => {
        setIsLoading(false);
        onError?.(msg);
      },
    });
  }

  function handleCancel() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg"
    >
      <h2 className="text-2xl font-bold text-slate-800 mb-1">
        Plan Your Medical Journey
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Tell us what you need — we'll find the right hospital, costs, and visa
        requirements in India.
      </p>

      {/* Condition */}
      <div className="mb-5">
        <label
          htmlFor="condition"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Medical condition or procedure
        </label>
        <input
          id="condition"
          name="condition"
          type="text"
          placeholder="e.g. knee replacement, heart bypass, kidney transplant"
          value={form.condition}
          onChange={handleChange}
          disabled={isLoading}
          className={`w-full rounded-lg border px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 transition
            ${errors.condition ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}
            disabled:opacity-60 disabled:cursor-not-allowed`}
        />
        {errors.condition && (
          <p className="mt-1 text-xs text-red-600">{errors.condition}</p>
        )}
      </div>

      {/* Country */}
      <div className="mb-5">
        <label
          htmlFor="origin_country"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Your country
        </label>
        <select
          id="origin_country"
          name="origin_country"
          value={form.origin_country}
          onChange={handleChange}
          disabled={isLoading}
          className={`w-full rounded-lg border px-4 py-2.5 text-sm text-slate-800
            focus:outline-none focus:ring-2 focus:ring-blue-500 transition
            ${errors.origin_country ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}
            disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          <option value="">Select your country</option>
          {COUNTRIES.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
          <option value="OTHER">Other (not listed)</option>
        </select>
        {errors.origin_country && (
          <p className="mt-1 text-xs text-red-600">{errors.origin_country}</p>
        )}
      </div>

      {/* Budget */}
      <div className="mb-5">
        <label
          htmlFor="budget_usd"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Total budget (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            $
          </span>
          <input
            id="budget_usd"
            name="budget_usd"
            type="number"
            min="1"
            step="100"
            placeholder="e.g. 8000"
            value={form.budget_usd}
            onChange={handleChange}
            disabled={isLoading}
            className={`w-full rounded-lg border pl-7 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition
              ${errors.budget_usd ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}
              disabled:opacity-60 disabled:cursor-not-allowed`}
          />
        </div>
        {errors.budget_usd && (
          <p className="mt-1 text-xs text-red-600">{errors.budget_usd}</p>
        )}
      </div>

      {/* Timeline */}
      <div className="mb-7">
        <label
          htmlFor="timeline_weeks"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          How soon do you need treatment?
        </label>
        <div className="flex items-center gap-3">
          <input
            id="timeline_weeks"
            name="timeline_weeks"
            type="number"
            min="1"
            max="52"
            value={form.timeline_weeks}
            onChange={handleChange}
            disabled={isLoading}
            className={`w-24 rounded-lg border px-4 py-2.5 text-sm text-slate-800
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition
              ${errors.timeline_weeks ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}
              disabled:opacity-60 disabled:cursor-not-allowed`}
          />
          <span className="text-sm text-slate-600">weeks from now</span>
        </div>
        {errors.timeline_weeks && (
          <p className="mt-1 text-xs text-red-600">{errors.timeline_weeks}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold
            rounded-lg py-2.5 text-sm transition
            disabled:opacity-60 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Planning your journey...
            </span>
          ) : (
            "Plan My Journey"
          )}
        </button>

        {isLoading && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 text-sm text-slate-600 border border-slate-300
              rounded-lg hover:bg-slate-50 transition
              focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}
