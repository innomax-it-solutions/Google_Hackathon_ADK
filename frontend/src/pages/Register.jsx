import { useId, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, ArrowRight, Loader2, ChevronDown } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import Seo from "../components/seo/Seo";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { COUNTRIES } from "../constants/countries";
import {
  validateEmail,
  validateRequired,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  passwordStrength,
} from "../utils/validation";

const STRENGTH_COLORS = [
  "bg-slate-200 dark:bg-white/10",
  "bg-red-400",
  "bg-amber-400",
  "bg-brand-400",
  "bg-emerald-500",
];

function CountrySelect({ value, onChange, onBlur, error }) {
  const id = useId();
  const invalid = Boolean(error);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-soft">
        Country<span className="ml-0.5 text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={invalid}
          className={`w-full appearance-none rounded-xl border bg-white py-2.5 pl-3.5 pr-10 text-sm shadow-sm outline-none transition
            focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:bg-slate-900/60
            ${value ? "text-ink" : "text-ink-muted/70"}
            ${invalid ? "border-red-400 dark:border-red-500/60" : "border-slate-200 dark:border-white/10"}`}
        >
          <option value="" disabled>
            Select your country
          </option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} className="text-ink">
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted" />
      </div>
      {invalid && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Register() {
  const { isAuthenticated } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const setField = (key) => (e) => {
    const val = e.target.value;
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const fieldError = (key, vals = values) => {
    switch (key) {
      case "fullName":
        return validateRequired(vals.fullName, "Full name");
      case "email":
        return validateEmail(vals.email);
      case "phone":
        return validatePhone(vals.phone);
      case "country":
        return validateRequired(vals.country, "Country");
      case "password":
        return validatePassword(vals.password);
      case "confirmPassword":
        return validateConfirmPassword(vals.confirmPassword, vals.password);
      default:
        return "";
    }
  };

  const blur = (key) => () => setErrors((p) => ({ ...p, [key]: fieldError(key) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const next = {};
    Object.keys(values).forEach((k) => {
      const err = fieldError(k);
      if (err) next[k] = err;
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);

    // UI-only: nothing is persisted or sent anywhere.
    show("Demo mode enabled — registration backend not connected.", { type: "info" });
  };

  const strength = passwordStrength(values.password);

  return (
    <>
      <Seo title="Create Account" path="/register" noindex />
    <AuthLayout
      title="Create your account"
      subtitle="Set up your Healtour workspace to start planning your medical journey."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthField
          label="Full name"
          name="name"
          icon={User}
          placeholder="Jane Doe"
          autoComplete="name"
          value={values.fullName}
          onChange={setField("fullName")}
          onBlur={blur("fullName")}
          error={errors.fullName}
          required
        />

        <AuthField
          label="Email"
          type="email"
          name="email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          value={values.email}
          onChange={setField("email")}
          onBlur={blur("email")}
          error={errors.email}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            label="Phone number"
            type="tel"
            name="phone"
            icon={Phone}
            placeholder="+1 555 000 1234"
            autoComplete="tel"
            inputMode="tel"
            value={values.phone}
            onChange={setField("phone")}
            onBlur={blur("phone")}
            error={errors.phone}
            required
          />
          <CountrySelect
            value={values.country}
            onChange={setField("country")}
            onBlur={blur("country")}
            error={errors.country}
          />
        </div>

        <div>
          <AuthField
            label="Password"
            type="password"
            name="new-password"
            icon={Lock}
            placeholder="Create a password"
            autoComplete="new-password"
            value={values.password}
            onChange={setField("password")}
            onBlur={blur("password")}
            error={errors.password}
            required
          />
          {values.password && (
            <div className="mt-2">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= strength.score ? STRENGTH_COLORS[strength.score] : STRENGTH_COLORS[0]
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-ink-muted">Password strength: {strength.label}</p>
            </div>
          )}
        </div>

        <AuthField
          label="Confirm password"
          type="password"
          name="confirm-password"
          icon={Lock}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={setField("confirmPassword")}
          onBlur={blur("confirmPassword")}
          error={errors.confirmPassword}
          required
        />

        <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.99 }} className="btn-primary mt-1 w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>

        <p className="text-center text-xs leading-relaxed text-ink-muted">
          This is a demo environment — no account is actually created and no data is stored.
        </p>
      </form>
    </AuthLayout>
    </>
  );
}
