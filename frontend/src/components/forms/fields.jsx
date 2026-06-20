import { useId } from "react";
import { ChevronDown } from "lucide-react";

const baseInput = `w-full rounded-xl border bg-white text-sm text-ink shadow-sm outline-none transition
  placeholder:text-ink-muted/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15
  disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900/60`;

const borderState = (invalid) =>
  invalid
    ? "border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/60"
    : "border-slate-200 dark:border-white/10";

function Label({ id, label, required }) {
  return (
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-soft">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function Error({ id, error }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
      {error}
    </p>
  );
}

/** Labeled multiline textarea matching AuthField styling. */
export function TextAreaField({ label, value, onChange, onBlur, error, name, placeholder, rows = 5, required = false, className = "" }) {
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  return (
    <div className={className}>
      <Label id={id} label={label} required={required} />
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        className={`${baseInput} resize-y px-3.5 py-2.5 ${borderState(invalid)}`}
      />
      <Error id={errorId} error={error} />
    </div>
  );
}

/** Labeled native select with a leading placeholder option. */
export function SelectField({ label, value, onChange, onBlur, error, name, options = [], placeholder = "Select…", required = false, className = "" }) {
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  return (
    <div className={className}>
      <Label id={id} label={label} required={required} />
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className={`${baseInput} appearance-none px-3.5 py-2.5 pr-10 ${borderState(invalid)} ${!value ? "text-ink-muted/70" : ""}`}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-ink">{o.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      </div>
      <Error id={errorId} error={error} />
    </div>
  );
}
