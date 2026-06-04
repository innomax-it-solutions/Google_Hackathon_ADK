/**
 * FormPage — "Hospital Finder" (/Form).
 *
 * A structured intake form (condition, country, budget, timeline) that streams the
 * backend's /run endpoint and renders the structured Journey Plan dashboard.
 *
 * Functionality is ported from the `feat/venkat-journey-plan-card` branch
 * (validation rules + the postIntake → /run SSE flow), restyled to the chat
 * app's CSS-variable theme so light/dark mode match the home page.
 */

import { useState, useRef } from "react";
import Header             from "../components/Header/Header";
import JourneyPlanCard    from "../components/JourneyPlanCard/JourneyPlanCard";
import CardErrorBoundary  from "../components/JourneyPlanCard/CardErrorBoundary";
import { Button }         from "../components/ui/button";
import { COUNTRIES }      from "../constants/countries";
import { useLanguage }    from "../context/LanguageContext";
import { submitIntakeForm } from "../services/api";
import { cn }             from "../lib/utils";

const INITIAL_FORM = { condition: "", origin_country: "", budget_usd: "", timeline_weeks: 6 };
const EMPTY_PLAN = { hospital: null, cost: null, docs: null, booking: null };

// Defensively unwrap an ADK tool_result payload to the underlying tool dict.
function unwrap(response) {
  if (!response || typeof response !== "object") return null;
  return response.result ?? response.response ?? response;
}

// Per-field validation — returns an error string or null (ported from the reference branch).
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
      if (n < 500) return "Minimum realistic budget is $500.";
      if (n > 500000) return "Please enter a budget under $500,000.";
      return null;
    }
    case "timeline_weeks": {
      const n = Number(value);
      if (!value && value !== 0) return "Please enter how many weeks you have.";
      if (isNaN(n) || n < 1) return "Timeline must be at least 1 week.";
      if (n > 52) return "Please enter a timeline under 52 weeks.";
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

export default function FormPage() {
  const { language } = useLanguage();

  const [form, setForm]       = useState(INITIAL_FORM);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan]           = useState(EMPTY_PLAN);
  const [summary, setSummary]     = useState("");
  const [intake, setIntake]       = useState(null);
  const [hasResult, setHasResult] = useState(false);
  const [error, setError]         = useState(null);
  const abortRef = useRef(null);

  const hasPlanData = plan.hospital || plan.cost || plan.docs || plan.booking;
  const showResult  = isLoading || hasResult || hasPlanData || error;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) || undefined }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) || undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ condition: true, origin_country: true, budget_usd: true, timeline_weeks: true });

    const validationErrors = validateAll(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      document.getElementById(Object.keys(validationErrors)[0])?.focus();
      return;
    }

    abortRef.current?.abort();

    const payload = {
      condition: form.condition.trim(),
      origin_country: form.origin_country,
      budget_usd: Number(form.budget_usd),
      timeline_weeks: Number(form.timeline_weeks),
      language,
    };

    setErrors({});
    setIntake(payload);
    setPlan(EMPTY_PLAN);
    setSummary("");
    setError(null);
    setHasResult(false);
    setIsLoading(true);

    abortRef.current = submitIntakeForm(payload, {
      onToken: (text) => setSummary((prev) => prev + text),
      onToolResult: (name, response) => {
        const data = unwrap(response);
        if (!data) return;
        setPlan((prev) => {
          switch (name) {
            case "find_hospitals":         return { ...prev, hospital: data };
            case "estimate_cost":          return { ...prev, cost: data };
            case "get_document_checklist": return { ...prev, docs: data };
            case "request_appointment":    return { ...prev, booking: data };
            default:                       return prev;
          }
        });
      },
      onDone: () => { setIsLoading(false); setHasResult(true); },
      onError: (err) => {
        setIsLoading(false);
        setError(
          err?.message ||
          (err?.status ? `The service returned an error (${err.status}).` : "Something went wrong. Please try again.")
        );
      },
    });
  }

  function handleReset() {
    abortRef.current?.abort();
    abortRef.current = null;
    setForm(INITIAL_FORM);
    setErrors({});
    setTouched({});
    setPlan(EMPTY_PLAN);
    setSummary("");
    setIntake(null);
    setHasResult(false);
    setError(null);
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] overflow-hidden">
      <Header />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

          {/* Intro */}
          <div className="text-center mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Find your hospital
            </h1>
            <p className="mt-2 text-[14px] text-[var(--color-text-secondary)] max-w-lg mx-auto">
              Tell us your condition, country and budget — MedBridge matches the right hospital,
              estimates costs, and prepares your visa checklist.
            </p>
          </div>

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-5 sm:p-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="condition" label="What treatment do you need?" error={errors.condition} className="sm:col-span-2">
                <input
                  id="condition" name="condition" type="text" maxLength={200}
                  placeholder='e.g. "knee replacement", "heart bypass"'
                  value={form.condition} onChange={handleChange} onBlur={handleBlur}
                  disabled={isLoading} className={inputClass(errors.condition)}
                />
              </Field>

              <Field id="origin_country" label="Your home country" error={errors.origin_country}>
                <select
                  id="origin_country" name="origin_country"
                  value={form.origin_country} onChange={handleChange} onBlur={handleBlur}
                  disabled={isLoading} className={inputClass(errors.origin_country)}
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map(({ code, name }) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </Field>

              <Field id="budget_usd" label="Total budget (USD)" error={errors.budget_usd}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] text-sm">$</span>
                  <input
                    id="budget_usd" name="budget_usd" type="number" min="500" max="500000" step="100"
                    placeholder="e.g. 8000"
                    value={form.budget_usd} onChange={handleChange} onBlur={handleBlur}
                    disabled={isLoading} className={cn(inputClass(errors.budget_usd), "pl-7")}
                  />
                </div>
              </Field>

              <Field id="timeline_weeks" label="How soon? (weeks)" error={errors.timeline_weeks} className="sm:col-span-2">
                <input
                  id="timeline_weeks" name="timeline_weeks" type="number" min="1" max="52"
                  value={form.timeline_weeks} onChange={handleChange} onBlur={handleBlur}
                  disabled={isLoading} className={cn(inputClass(errors.timeline_weeks), "w-32")}
                />
              </Field>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <Button type="submit" variant="gradient" size="lg" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2"><Spinner /> Planning your journey…</span>
                ) : (
                  "Get my Journey Plan →"
                )}
              </Button>
              {showResult && (
                <Button type="button" variant="outline" size="lg" onClick={handleReset} disabled={isLoading}>
                  Reset
                </Button>
              )}
            </div>
          </form>

          {/* Result */}
          {showResult && (
            <div className="mt-6">
              {error ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-2xl px-5 py-4 text-sm">
                  <p className="font-semibold mb-1">We couldn't complete your request</p>
                  <p>Please try again — it usually resolves on its own.</p>
                </div>
              ) : (
                <CardErrorBoundary>
                  <JourneyPlanCard
                    intake={intake}
                    hospital={plan.hospital}
                    cost={plan.cost}
                    docs={plan.docs}
                    booking={plan.booking}
                    summary={summary}
                    isLoading={isLoading}
                  />
                </CardErrorBoundary>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- Small themed pieces ---------------------------------------------------

function Field({ id, label, error, children, className }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

function inputClass(hasError) {
  return cn(
    "w-full rounded-xl border px-3.5 py-2.5 text-[14px] bg-[var(--color-surface)] text-[var(--color-text-primary)]",
    "placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 transition-colors duration-150",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    hasError
      ? "border-red-400 focus:ring-red-200 dark:focus:ring-red-900"
      : "border-[var(--color-border)] hover:border-[var(--color-accent-muted)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-muted)]"
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
