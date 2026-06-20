/**
 * ProfilePanel — the patient's health + customer details (Profile tab).
 *
 * Browser-only via ProfileContext. Saving persists to localStorage (per user)
 * and the values auto-prefill the Hospital Finder intake (see FormPage). Styled
 * with the same CSS-variable tokens + input shape as FormPage / SearchableSelect.
 */

import { useEffect, useState } from "react";
import { useProfile }    from "../../context/ProfileContext";
import { useToast }      from "../../context/ToastContext";
import { Button }        from "../ui/button";
import SearchableSelect  from "../ui/SearchableSelect";
import { COUNTRIES }     from "../../constants/countries";
import { SUPPORT_LANGUAGES } from "../../constants/languages";

const COUNTRY_OPTIONS  = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const LANGUAGE_OPTIONS = SUPPORT_LANGUAGES.map((l) => ({ value: l.code, label: l.name }));
const SEX_OPTIONS      = ["", "Female", "Male", "Other", "Prefer not to say"];
const BLOOD_OPTIONS    = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const inputClass =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 " +
  "text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] " +
  "transition-colors focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]";

const labelClass = "block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5";

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mt-1 mb-1">
      {children}
    </h3>
  );
}

export default function ProfilePanel() {
  const { profile, saveProfile } = useProfile();
  const { toast } = useToast();

  const [form, setForm] = useState(profile);

  // Resync if the underlying profile changes (e.g. switching demo accounts).
  useEffect(() => { setForm(profile); }, [profile]);

  function set(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSave() {
    saveProfile(form);
    toast({ title: "Profile saved", description: "We'll use these details to plan your journey.", variant: "success" });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">

        <p className="text-[12.5px] text-[var(--color-text-tertiary)] leading-relaxed">
          Saved on this device only. These details pre-fill the Hospital Finder and help the
          assistant plan your trip.
        </p>

        <SectionTitle>Contact</SectionTitle>

        <Field label="Full name">
          <input className={inputClass} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="e.g. Sanjay Kumar" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+971…" />
          </Field>
          <Field label="Travellers">
            <input type="number" min={1} max={9} className={inputClass} value={form.travellers} onChange={(e) => set("travellers", e.target.value)} />
          </Field>
        </div>

        <Field label="Country (origin)">
          <SearchableSelect
            value={form.origin_country}
            onChange={(v) => set("origin_country", v)}
            options={COUNTRY_OPTIONS}
            placeholder="Select your country"
          />
        </Field>

        <Field label="Departure city">
          <input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Dubai" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of birth">
            <input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
          </Field>
          <Field label="Passport no.">
            <input className={inputClass} value={form.passportNumber} onChange={(e) => set("passportNumber", e.target.value)} placeholder="Optional" />
          </Field>
        </div>

        <Field label="Preferred / interpreter language">
          <SearchableSelect
            value={form.preferredLanguage}
            onChange={(v) => set("preferredLanguage", v)}
            options={LANGUAGE_OPTIONS}
            placeholder="English is fine"
          />
        </Field>

        <Field label="Emergency contact">
          <input className={inputClass} value={form.emergencyContact} onChange={(e) => set("emergencyContact", e.target.value)} placeholder="Name & phone" />
        </Field>

        <SectionTitle>Health</SectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sex">
            <select className={inputClass} value={form.sex} onChange={(e) => set("sex", e.target.value)}>
              {SEX_OPTIONS.map((o) => <option key={o} value={o}>{o || "Select"}</option>)}
            </select>
          </Field>
          <Field label="Blood group">
            <select className={inputClass} value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
              {BLOOD_OPTIONS.map((o) => <option key={o} value={o}>{o || "Select"}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Height (cm)">
            <input type="number" className={inputClass} value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} placeholder="170" />
          </Field>
          <Field label="Weight (kg)">
            <input type="number" className={inputClass} value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} placeholder="70" />
          </Field>
        </div>

        <Field label="Known conditions">
          <textarea rows={2} className={inputClass} value={form.conditions} onChange={(e) => set("conditions", e.target.value)} placeholder="e.g. Type 2 diabetes, hypertension" />
        </Field>
        <Field label="Current medications">
          <textarea rows={2} className={inputClass} value={form.medications} onChange={(e) => set("medications", e.target.value)} placeholder="Name & dose" />
        </Field>
        <Field label="Allergies">
          <textarea rows={2} className={inputClass} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="e.g. Penicillin" />
        </Field>
        <Field label="Past surgeries">
          <textarea rows={2} className={inputClass} value={form.pastSurgeries} onChange={(e) => set("pastSurgeries", e.target.value)} placeholder="With approximate dates" />
        </Field>
        <Field label="Notes">
          <textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything else the team should know" />
        </Field>
      </div>

      {/* Save bar */}
      <div className="flex-shrink-0 border-t border-[var(--color-border)] px-4 py-3 bg-[var(--color-bg)]">
        <Button variant="gradient" size="lg" onClick={handleSave} className="w-full">
          Save profile
        </Button>
      </div>
    </div>
  );
}
