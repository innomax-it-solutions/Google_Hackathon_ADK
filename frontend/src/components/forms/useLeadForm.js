import { useState } from "react";

/**
 * Minimal client-side form state for the UI-only lead pages (Contact, Partner,
 * Get Opinion). NO backend: a valid submit just flips `submitted` to true so the
 * page can show a success state. `validators` maps field name → (value, values)
 * returning an error string (falsy = valid).
 */
export function useLeadForm(initialValues, validators = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const setField = (name) => (eOrValue) => {
    const value = eOrValue?.target ? eOrValue.target.value : eOrValue;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  };

  function validate() {
    const next = {};
    for (const [field, fn] of Object.entries(validators)) {
      const msg = fn(values[field], values);
      if (msg) next[field] = msg;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e?.preventDefault?.();
    if (validate()) setSubmitted(true);
  }

  function reset() {
    setValues(initialValues);
    setErrors({});
    setSubmitted(false);
  }

  return { values, errors, submitted, setField, setValues, handleSubmit, reset };
}

// --- common validators -------------------------------------------------------
export const required = (label = "This field") => (v) =>
  String(v ?? "").trim() ? "" : `${label} is required.`;

export const email = (v) =>
  !v ? "Email is required." : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) ? "" : "Enter a valid email address.";
