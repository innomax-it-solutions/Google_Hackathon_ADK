import { useState, useRef } from "react";
import { postIntake } from "./api";
import { COUNTRIES } from "./constants/countries";

const INITIAL_FORM = {
  condition: "",
  origin_country: "",
  budget_usd: "",
  timeline_weeks: 6,
};

// Per-field validation — returns an error string or null
function validateField(name, value) {
  switch (name) {
    case "condition": {
      const v = (value || "").trim();
      if (!v) return "Please describe your medical condition or procedure.";
      if (v.length < 3) return "Please be a little more specific (at least 3 characters).";
      if (v.length > 200) return "Please keep this under 200 characters.";
      if (/^\d+$/.test(v)) return "Please describe your condition in words, not numbers.";
      return null;
    }
    case "origin_country":
      if (!value) return "Please select your country so we can check visa requirements.";
      return null;
    case "budget_usd": {
      const n = Number(value);
      if (!value && value !== 0) return "Please enter your total budget.";
      if (isNaN(n) || n <= 0) return "Budget must be greater than $0.";
      if (n < 500) return "Minimum realistic budget is $500. Most procedures start from $1,000.";
      if (n > 500000) return "Please enter a budget under $500,000.";
      return null;
    }
    case "timeline_weeks": {
      const n = Number(value);
      if (!value && value !== 0) return "Please enter how many weeks you have.";
      if (isNaN(n) || n < 1) return "Timeline must be at least 1 week.";
      if (n > 52) return "Please enter a timeline under 52 weeks (1 year).";
      return null;
    }
    default:
      return null;
  }
}

function validateAll(form) {
  const errors = {};
  for (const name of ["condition", "origin_country", "budget_usd", "timeline_weeks"]) {
    const err = validateField(name, form[name]);
    if (err) errors[name] = err;
  }
  return errors;
}

// Human-friendly names for backend tool calls
const TOOL_LABELS = {
  find_hospitals: "Finding matching hospitals in India",
  estimate_cost: "Estimating treatment costs",
  get_document_checklist: "Checking visa & document requirements",
  request_appointment: "Booking your appointment",
};

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
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState([]); // tools currently running
  const [completedTools, setCompletedTools] = useState([]);
  const abortRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Re-validate live if the field was already touched
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err || undefined }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err || undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Mark all fields touched so errors show
    setTouched({ condition: true, origin_country: true, budget_usd: true, timeline_weeks: true });

    const validationErrors = validateAll(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrField = document.getElementById(Object.keys(validationErrors)[0]);
      firstErrField?.focus();
      return;
    }

    if (abortRef.current) abortRef.current.abort();

    setIsLoading(true);
    setErrors({});
    setActiveTools([]);
    setCompletedTools([]);
    onLoadingStart?.();

    const payload = {
      condition: form.condition.trim(),
      origin_country: form.origin_country === "OTHER" ? "GENERIC" : form.origin_country,
      budget_usd: Number(form.budget_usd),
      timeline_weeks: Number(form.timeline_weeks),
    };

    abortRef.current = postIntake(payload, {
      onSession: (id) => onSession?.(id),
      onToken: (text) => onToken?.(text),
      onToolCall: (name) => {
        setActiveTools((prev) => [...prev, name]);
        onToolCall?.(name);
      },
      onToolResult: (name, resp) => {
        setActiveTools((prev) => prev.filter((t) => t !== name));
        setCompletedTools((prev) => [...prev, name]);
        onToolResult?.(name, resp);
      },
      onDone: () => {
        setIsLoading(false);
        setActiveTools([]);
        onDone?.();
      },
      onError: (msg) => {
        setIsLoading(false);
        setActiveTools([]);
        onError?.(msg);
      },
    });
  }

  function handleCancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setActiveTools([]);
  }

  const budgetNum = Number(form.budget_usd);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Plan Your Medical Journey</h2>
        <p className="mt-1 text-sm text-slate-500">
          Fill in your details and we'll match you with the best hospitals in India, estimate
          costs, and prepare your visa checklist — in seconds.
        </p>
      </div>

      {/* Condition */}
      <Field
        id="condition"
        label="What treatment do you need?"
        hint='e.g. "knee replacement", "heart bypass", "kidney transplant"'
        error={errors.condition}
      >
        <input
          id="condition"
          name="condition"
          type="text"
          placeholder="Describe your condition or procedure"
          value={form.condition}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          maxLength={200}
          className={inputClass(errors.condition)}
        />
        {form.condition.length > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {form.condition.length}/200
          </span>
        )}
      </Field>

      {/* Country */}
      <Field
        id="origin_country"
        label="Your home country"
        hint="Used to generate your visa & document checklist"
        error={errors.origin_country}
      >
        <select
          id="origin_country"
          name="origin_country"
          value={form.origin_country}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          className={inputClass(errors.origin_country)}
        >
          <option value="">Select your country</option>
          {COUNTRIES.map(({ code, name }) => (
            <option key={code} value={code}>{name}</option>
          ))}
          <option value="OTHER">Other (not listed above)</option>
        </select>
        {form.origin_country === "OTHER" && (
          <InfoNote>
            We'll use a general India visa checklist for your country. Your coordinator will
            confirm the exact requirements.
          </InfoNote>
        )}
      </Field>

      {/* Budget */}
      <Field
        id="budget_usd"
        label="Your total budget (USD)"
        hint="Include surgery, hospital stay, and local costs. Flights & accommodation are separate."
        error={errors.budget_usd}
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
            $
          </span>
          <input
            id="budget_usd"
            name="budget_usd"
            type="number"
            min="500"
            max="500000"
            step="100"
            placeholder="e.g. 8000"
            value={form.budget_usd}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            className={`${inputClass(errors.budget_usd)} pl-7`}
          />
        </div>
        {!errors.budget_usd && budgetNum > 0 && (
          <BudgetHint budget={budgetNum} />
        )}
      </Field>

      {/* Timeline */}
      <Field
        id="timeline_weeks"
        label="How soon do you need treatment?"
        hint="We'll prioritise hospitals and visa processing that fit your timeline."
        error={errors.timeline_weeks}
        className="mb-7"
      >
        <div className="flex items-center gap-3">
          <input
            id="timeline_weeks"
            name="timeline_weeks"
            type="number"
            min="1"
            max="52"
            value={form.timeline_weeks}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            className={`w-28 ${inputClass(errors.timeline_weeks)}`}
          />
          <span className="text-sm text-slate-600">weeks from now</span>
        </div>
        {!errors.timeline_weeks && Number(form.timeline_weeks) > 0 && Number(form.timeline_weeks) < 3 && (
          <InfoNote type="warning">
            Very short timeline — visa processing alone can take 3–10 business days. We'll flag
            urgent options for you.
          </InfoNote>
        )}
      </Field>

      {/* Tool progress (during loading) */}
      {isLoading && (
        <ToolProgress active={activeTools} completed={completedTools} />
      )}

      {/* Submit / Cancel */}
      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white
            font-semibold rounded-lg py-3 text-sm transition
            disabled:opacity-60 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Planning your journey...
            </span>
          ) : (
            "Plan My Journey \u2192"
          )}
        </button>

        {isLoading && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-3 text-sm text-slate-600 border border-slate-300
              rounded-lg hover:bg-slate-50 transition
              focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Your information is used only to generate your personalised Journey Plan.
      </p>
    </form>
  );
}

// --- Sub-components ---

function Field({ id, label, hint, error, children, className = "mb-5" }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">{children}</div>
      {hint && !error && (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-start gap-1">
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

function InfoNote({ children, type = "info" }) {
  const styles = type === "warning"
    ? "bg-amber-50 border-amber-200 text-amber-700"
    : "bg-blue-50 border-blue-200 text-blue-700";
  return (
    <p className={`mt-2 text-xs border rounded-lg px-3 py-2 ${styles}`}>
      {children}
    </p>
  );
}

function BudgetHint({ budget }) {
  let msg = null;
  if (budget < 2000) msg = { text: "Very limited — may restrict options. Most procedures start from $2,000.", color: "text-amber-600" };
  else if (budget < 5000) msg = { text: "Good for many general and orthopaedic procedures.", color: "text-green-600" };
  else if (budget < 15000) msg = { text: "Covers most cardiac, orthopaedic, and oncology procedures.", color: "text-green-600" };
  else msg = { text: "Excellent budget — covers virtually all procedures at top-tier hospitals.", color: "text-green-600" };

  return <p className={`mt-1 text-xs ${msg.color}`}>{msg.text}</p>;
}

const TOOL_STEPS = [
  { key: "find_hospitals", label: "Finding matching hospitals" },
  { key: "estimate_cost", label: "Estimating treatment costs" },
  { key: "get_document_checklist", label: "Checking visa & documents" },
];

function ToolProgress({ active, completed }) {
  return (
    <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 space-y-2">
      <p className="text-xs font-medium text-blue-700 mb-1">Building your Journey Plan...</p>
      {TOOL_STEPS.map(({ key, label }) => {
        const isActive = active.includes(key);
        const isDone = completed.includes(key);
        return (
          <div key={key} className="flex items-center gap-2 text-xs">
            {isDone ? (
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : isActive ? (
              <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              </span>
            ) : (
              <span className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
            )}
            <span className={isDone ? "text-green-700" : isActive ? "text-blue-700 font-medium" : "text-slate-400"}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function inputClass(hasError) {
  return [
    "w-full rounded-lg border px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 transition",
    hasError ? "border-red-400 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400",
    "disabled:opacity-60 disabled:cursor-not-allowed",
  ].join(" ");
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
