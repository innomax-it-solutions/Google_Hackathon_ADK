import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Accessible labeled input used across the auth forms.
 * - Renders an optional leading icon.
 * - For `type="password"`, shows a built-in visibility toggle.
 * - Surfaces inline validation errors with aria wiring.
 */
export default function AuthField({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  icon: Icon,
  placeholder,
  autoComplete,
  inputMode,
  name,
  required = false,
  className = "",
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const [reveal, setReveal] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (reveal ? "text" : "password") : type;
  const invalid = Boolean(error);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-ink-soft"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted"
          />
        )}

        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className={`w-full rounded-xl border bg-white py-2.5 text-sm text-ink shadow-sm outline-none transition
            placeholder:text-ink-muted/70
            focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15
            disabled:cursor-not-allowed disabled:opacity-60
            dark:bg-slate-900/60
            ${Icon ? "pl-11" : "pl-3.5"}
            ${isPassword ? "pr-11" : "pr-3.5"}
            ${
              invalid
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/60"
                : "border-slate-200 dark:border-white/10"
            }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            tabIndex={-1}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted transition hover:text-ink-soft focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {reveal ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>

      {invalid && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
