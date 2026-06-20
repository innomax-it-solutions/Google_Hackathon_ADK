import { Building2, User, Mail, Phone, Globe, Globe2, TrendingUp, HeartHandshake, ShieldCheck } from "lucide-react";
import LeadPageLayout from "../components/forms/LeadPageLayout";
import Seo from "../components/seo/Seo";
import { breadcrumbSchema } from "../seo/schema";
import SuccessState from "../components/forms/SuccessState";
import AuthField from "../components/auth/AuthField";
import { TextAreaField, SelectField } from "../components/forms/fields";
import { useLeadForm, required, email } from "../components/forms/useLeadForm";
import { COUNTRIES } from "../constants/countries";

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.name, label: c.name }));
const PARTNER_TYPES = ["Hospital", "Clinic / Day-care centre", "Independent doctor", "Facilitator / Agency", "Other"].map((t) => ({ value: t, label: t }));

const BENEFITS = [
  { icon: Globe2, title: "Global patient reach", text: "Get discovered by international patients actively planning treatment." },
  { icon: TrendingUp, title: "Qualified referrals", text: "AI-matched leads with the right condition, budget and timeline." },
  { icon: HeartHandshake, title: "End-to-end coordination", text: "We handle estimates, visa guidance and travel so you focus on care." },
  { icon: ShieldCheck, title: "Trusted, accredited network", text: "Join a curated network of JCI & NABH accredited partners." },
];

export default function BecomePartnerPage() {
  const form = useLeadForm(
    { organisation: "", type: "", contact: "", email: "", phone: "", country: "", website: "", message: "" },
    { organisation: required("Organisation name"), type: required("Partner type"), contact: required("Contact person"), email },
  );
  const { values, errors, setField } = form;

  return (
    <>
      <Seo
        title="Become a Partner"
        description="Partner with Healtour — hospitals, clinics, doctors and facilitators can join our accredited network and reach international patients."
        path="/partner"
        jsonLd={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Become a Partner", path: "/partner" }])}
      />
    <LeadPageLayout
      eyebrow="Become a Partner"
      icon="ShieldCheck"
      title="Partner with Healtour"
      intro="Hospitals, clinics, doctors and facilitators — join our accredited network and connect with international patients through an AI-powered platform."
      sidebar={
        <div className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Why partner with us</h2>
          <ul className="mt-5 space-y-5">
            {BENEFITS.map(({ icon: Ico, title, text }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <Ico className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      }
    >
      {form.submitted ? (
        <SuccessState
          title="Application received!"
          message="Thanks for your interest in partnering with Healtour. Our partnerships team will review your details and reach out shortly. (Demo form — nothing was actually submitted.)"
          onReset={form.reset}
          resetLabel="Submit another application"
        />
      ) : (
        <form onSubmit={form.handleSubmit} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <AuthField label="Organisation name" name="organisation" required icon={Building2} value={values.organisation} onChange={setField("organisation")} error={errors.organisation} placeholder="e.g. Apollo Hospital" />
            <SelectField label="Partner type" name="type" required value={values.type} onChange={setField("type")} options={PARTNER_TYPES} error={errors.type} placeholder="Select type" />
            <AuthField label="Contact person" name="contact" required icon={User} value={values.contact} onChange={setField("contact")} error={errors.contact} placeholder="Full name" autoComplete="name" />
            <AuthField label="Work email" name="email" type="email" required icon={Mail} value={values.email} onChange={setField("email")} error={errors.email} placeholder="you@organisation.com" autoComplete="email" />
            <AuthField label="Phone" name="phone" type="tel" icon={Phone} value={values.phone} onChange={setField("phone")} placeholder="Optional" inputMode="tel" autoComplete="tel" />
            <SelectField label="Country" name="country" value={values.country} onChange={setField("country")} options={COUNTRY_OPTIONS} placeholder="Select your country" />
          </div>
          <AuthField label="Website" name="website" icon={Globe} value={values.website} onChange={setField("website")} placeholder="https:// (optional)" inputMode="url" />
          <TextAreaField label="Tell us about your organisation" name="message" value={values.message} onChange={setField("message")} placeholder="Specialties, accreditations, locations, capacity…" />
          <button type="submit" className="btn-primary w-full sm:w-auto">Submit application</button>
        </form>
      )}
    </LeadPageLayout>
    </>
  );
}
