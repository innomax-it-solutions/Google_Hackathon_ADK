import { User, Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import LeadPageLayout from "../components/forms/LeadPageLayout";
import Seo from "../components/seo/Seo";
import { breadcrumbSchema } from "../seo/schema";
import SuccessState from "../components/forms/SuccessState";
import AuthField from "../components/auth/AuthField";
import { TextAreaField, SelectField } from "../components/forms/fields";
import Icon from "../components/ui/Icon";
import { useLeadForm, required, email } from "../components/forms/useLeadForm";
import { COUNTRIES } from "../constants/countries";
import { CONTACT, SOCIAL_LINKS, whatsappLink } from "../data/shellData";

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.name, label: c.name }));
const SUBJECTS = ["General enquiry", "Treatment & cost estimate", "Travel & visa help", "Feedback"].map((s) => ({ value: s, label: s }));
const mapsSrc = `https://www.google.com/maps?q=${encodeURIComponent(`${CONTACT.company}, ${CONTACT.address}`)}&output=embed`;

export default function ContactPage() {
  const form = useLeadForm(
    { name: "", email: "", phone: "", country: "", subject: "", message: "" },
    { name: required("Full name"), email, message: required("Message") },
  );
  const { values, errors, setField } = form;

  return (
    <>
      <Seo
        title="Contact Us"
        description="Get in touch with Healtour's patient-care team for help with treatment, travel, visas or costs."
        path="/contact"
        jsonLd={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])}
      />
    <LeadPageLayout
      eyebrow="Contact Us"
      icon="Mail"
      title="We're here to help"
      intro="Questions about treatment, travel or costs? Send us a message and our patient-care team will get back to you."
      sidebar={
        <>
          <div className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Reach us directly</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" /><a href={CONTACT.phoneHref} className="text-ink-soft hover:text-brand-700 dark:hover:text-brand-300">{CONTACT.phone}</a></li>
              <li className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" /><a href={CONTACT.emailHref} className="break-all text-ink-soft hover:text-brand-700 dark:hover:text-brand-300">{CONTACT.email}</a></li>
              <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" /><span className="text-ink-soft">{CONTACT.address}</span></li>
              <li className="flex items-start gap-3"><Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" /><span className="text-ink-soft">{CONTACT.hours}</span></li>
            </ul>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600">
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
            <div className="mt-5 flex items-center gap-2.5">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-ink-muted transition hover:border-brand-200 hover:text-brand-600 dark:border-white/10 dark:hover:text-brand-300">
                  <Icon name={s.icon} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <iframe title="Healtour location" src={mapsSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-56 w-full border-0" />
          </div>
        </>
      }
    >
      {form.submitted ? (
        <SuccessState
          title="Message sent!"
          message="Thanks for reaching out. Our patient-care team will respond within one business day. (This is a demo form — no message was actually sent.)"
          onReset={form.reset}
        />
      ) : (
        <form onSubmit={form.handleSubmit} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <AuthField label="Full name" name="name" required icon={User} value={values.name} onChange={setField("name")} error={errors.name} placeholder="Your name" autoComplete="name" />
            <AuthField label="Email" name="email" type="email" required icon={Mail} value={values.email} onChange={setField("email")} error={errors.email} placeholder="you@example.com" autoComplete="email" />
            <AuthField label="Phone" name="phone" type="tel" icon={Phone} value={values.phone} onChange={setField("phone")} placeholder="Optional" inputMode="tel" autoComplete="tel" />
            <SelectField label="Country" name="country" value={values.country} onChange={setField("country")} options={COUNTRY_OPTIONS} placeholder="Select your country" />
          </div>
          <SelectField label="Subject" name="subject" value={values.subject} onChange={setField("subject")} options={SUBJECTS} placeholder="What's this about?" />
          <TextAreaField label="Message" name="message" required value={values.message} onChange={setField("message")} error={errors.message} placeholder="How can we help?" />
          <button type="submit" className="btn-primary w-full sm:w-auto">Send message</button>
        </form>
      )}
    </LeadPageLayout>
    </>
  );
}
