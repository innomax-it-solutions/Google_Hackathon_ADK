import { useRef, useState } from "react";
import { User, Mail, Phone, Paperclip, X, FileText, ClipboardList, UserCheck, ShieldCheck, Clock } from "lucide-react";
import LeadPageLayout from "../components/forms/LeadPageLayout";
import Seo from "../components/seo/Seo";
import { breadcrumbSchema } from "../seo/schema";
import SuccessState from "../components/forms/SuccessState";
import AuthField from "../components/auth/AuthField";
import { TextAreaField, SelectField } from "../components/forms/fields";
import { useLeadForm, required, email } from "../components/forms/useLeadForm";
import { COUNTRIES } from "../constants/countries";
import { SPECIALTIES } from "../data/shellData";

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.name, label: c.name }));
const SPECIALTY_OPTIONS = [
  ...SPECIALTIES.map((s) => ({ value: s.name, label: s.name })),
  { value: "Other", label: "Other / not sure" },
];

const STEPS = [
  { icon: ClipboardList, title: "Share your case", text: "Tell us your condition and upload any reports you have." },
  { icon: UserCheck, title: "Specialist review", text: "Relevant specialists from our network review your details." },
  { icon: FileText, title: "Free written opinion", text: "Receive guidance on options, hospitals and indicative costs." },
];

export default function GetOpinionPage() {
  const form = useLeadForm(
    { name: "", email: "", phone: "", country: "", specialty: "", details: "" },
    { name: required("Full name"), email, details: required("Condition details") },
  );
  const { values, errors, setField } = form;

  const [files, setFiles] = useState([]);
  const fileRef = useRef(null);

  function onPickFiles(e) {
    const picked = Array.from(e.target.files || []).map((f) => f.name);
    setFiles((prev) => [...prev, ...picked]);
    e.target.value = ""; // allow re-picking the same file
  }
  function removeFile(i) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleReset() {
    setFiles([]);
    form.reset();
  }

  return (
    <>
      <Seo
        title="Get a Free Opinion"
        description="Share your medical details and reports to receive a free, no-obligation opinion from specialists in Healtour's accredited network."
        path="/opinion"
        jsonLd={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Get a Free Opinion", path: "/opinion" }])}
      />
    <LeadPageLayout
      eyebrow="Get a Free Opinion"
      icon="Stethoscope"
      title="Get a free expert opinion"
      intro="Share your medical details and reports to receive a free, no-obligation opinion from specialists in Healtour's accredited network."
      sidebar={
        <>
          <div className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">How it works</h2>
            <ol className="mt-5 space-y-5">
              {STEPS.map(({ icon: Ico, title, text }, i) => (
                <li key={title} className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                    <Ico className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{i + 1}. {title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="card flex flex-col gap-3 p-6 text-sm text-ink-muted">
            <p className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> 100% free &amp; confidential</p>
            <p className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-500" /> Typical response within 48 hours</p>
          </div>
        </>
      }
    >
      {form.submitted ? (
        <SuccessState
          title="Request received!"
          message="Thanks for sharing your details. A specialist will review your case and send a free opinion soon. (Demo form — nothing was actually uploaded or sent.)"
          onReset={handleReset}
          resetLabel="Submit another request"
        />
      ) : (
        <form onSubmit={form.handleSubmit} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <AuthField label="Full name" name="name" required icon={User} value={values.name} onChange={setField("name")} error={errors.name} placeholder="Your name" autoComplete="name" />
            <AuthField label="Email" name="email" type="email" required icon={Mail} value={values.email} onChange={setField("email")} error={errors.email} placeholder="you@example.com" autoComplete="email" />
            <AuthField label="Phone" name="phone" type="tel" icon={Phone} value={values.phone} onChange={setField("phone")} placeholder="Optional" inputMode="tel" autoComplete="tel" />
            <SelectField label="Country" name="country" value={values.country} onChange={setField("country")} options={COUNTRY_OPTIONS} placeholder="Select your country" />
          </div>
          <SelectField label="Treatment / specialty of interest" name="specialty" value={values.specialty} onChange={setField("specialty")} options={SPECIALTY_OPTIONS} placeholder="Select a specialty" />
          <TextAreaField label="Describe your condition" name="details" required value={values.details} onChange={setField("details")} error={errors.details} placeholder="Symptoms, diagnosis, prior treatment, what you'd like an opinion on…" rows={6} />

          {/* Reports upload — UI only (no upload happens) */}
          <div>
            <p className="mb-1.5 block text-sm font-medium text-ink-soft">Medical reports <span className="text-ink-muted">(optional)</span></p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-ink-muted transition hover:border-brand-300 hover:text-brand-600 dark:border-white/15 dark:hover:border-brand-400/50 dark:hover:text-brand-300"
            >
              <Paperclip className="h-4 w-4" /> Attach reports (PDF, JPG, PNG)
            </button>
            <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={onPickFiles} className="hidden" />
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((name, i) => (
                  <li key={`${name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10">
                    <span className="inline-flex min-w-0 items-center gap-2 text-ink-soft">
                      <FileText className="h-4 w-4 flex-shrink-0 text-brand-500" /> <span className="truncate">{name}</span>
                    </span>
                    <button type="button" onClick={() => removeFile(i)} aria-label={`Remove ${name}`} className="flex-shrink-0 text-ink-muted hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className="btn-primary w-full sm:w-auto">Request free opinion</button>
        </form>
      )}
    </LeadPageLayout>
    </>
  );
}
