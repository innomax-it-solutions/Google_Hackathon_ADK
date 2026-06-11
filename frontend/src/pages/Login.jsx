import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Wand2 } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import FormAlert from "../components/auth/FormAlert";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { validateEmail, validatePassword } from "../utils/validation";
import { credentialsConfigured, getDemoCredentials } from "../utils/auth";

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/chat";

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [remember, setRemember] = useState(true);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in → skip the form.
  if (isAuthenticated) return <Navigate to={from} replace />;

  const setField = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
  };

  const runValidation = () => {
    const next = {
      email: validateEmail(values.email),
      password: validatePassword(values.password, { min: 1 }),
    };
    setErrors(next);
    return !next.email && !next.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setFormError("");
    if (!runValidation()) return;

    setLoading(true);
    // Simulated latency so the loading state reads like a real sign-in.
    await new Promise((r) => setTimeout(r, 750));
    const result = await login(values.email, values.password, remember);
    setLoading(false);

    if (result.ok) {
      show("Signed in successfully. Welcome back!", { type: "success" });
      navigate(from, { replace: true });
    } else {
      setFormError(result.error);
    }
  };

  const fillDemo = () => {
    const demo = getDemoCredentials();
    setValues({ email: demo.email, password: demo.password });
    setErrors({});
    setFormError("");
  };

  const forgotPassword = () => {
    show("Password recovery is disabled in this demo environment.", { type: "info" });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your MVT Bridge workspace."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormAlert message={formError} />

        <AuthField
          label="Email"
          type="email"
          name="email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          value={values.email}
          onChange={setField("email")}
          onBlur={() => setErrors((p) => ({ ...p, email: validateEmail(values.email) }))}
          error={errors.email}
          required
        />

        <div>
          <AuthField
            label="Password"
            type="password"
            name="password"
            icon={Lock}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={values.password}
            onChange={setField("password")}
            onBlur={() => setErrors((p) => ({ ...p, password: validatePassword(values.password, { min: 1 }) }))}
            error={errors.password}
            required
          />

          <div className="mt-3 flex items-center justify-between">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-white/20 dark:bg-slate-900"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={forgotPassword}
              className="text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.99 }}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>

        {credentialsConfigured() && (
          <button
            type="button"
            onClick={fillDemo}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-medium text-ink-muted transition hover:border-brand-300 hover:text-brand-600 dark:border-white/15 dark:hover:border-brand-400/40 dark:hover:text-brand-300"
          >
            <Wand2 className="h-3.5 w-3.5" /> Fill demo credentials
          </button>
        )}
      </form>
    </AuthLayout>
  );
}
