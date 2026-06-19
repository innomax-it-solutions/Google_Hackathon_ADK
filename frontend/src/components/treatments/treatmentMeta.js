// ---------------------------------------------------------------------------
// Shared presentation helpers for the Treatments module.
//
// The content snapshot (data/healtour/treatments.json) is messy: department may
// be null, cost values are placeholder garbage (e.g. "INR 1515 / INR 155"), and
// there is no FAQ field. These helpers normalise that for the UI without
// touching the data: derive an icon/gradient per specialty, format the stay,
// derive FAQs from real fields, and light-sanitize the first-party HTML body.
// ---------------------------------------------------------------------------

// Map a department/specialty name to a registered Icon name (see ui/Icon.jsx).
const DEPT_ICON = {
  Cardiology: "HeartPulse",
  Neurology: "Brain",
  Neurosurgery: "Brain",
  Psychiatry: "Brain",
  Oncology: "Microscope",
  "Uro-Oncology": "Microscope",
  Haematology: "Droplets",
  Orthopaedics: "Bone",
  "Pediatric Orthopedics": "Bone",
  Gastroenterology: "Pill",
  Proctologist: "Pill",
  Urology: "Droplets",
  Andrology: "Droplets",
  Nephrology: "Droplets",
  Hepatology: "Activity",
  Endocrinology: "Activity",
  Dermatology: "Activity",
  Radiology: "Activity",
  "Critical Care": "Activity",
  Gynaecology: "Baby",
  Gynecology: "Baby",
  Pediatrics: "Baby",
  Pulmonology: "Wind",
  "Plastic Surgery": "Scissors",
  "General Surgery": "Scissors",
  "Surgical Services": "Scissors",
  "Vascular & Thoracic Surgery": "Scissors",
  Ophthalmology: "Eye",
  "Otolaryngology (ENT)": "Stethoscope",
};

const GRADIENTS = [
  "from-blue-500 to-indigo-500",
  "from-sky-500 to-cyan-500",
  "from-teal-500 to-emerald-500",
  "from-violet-500 to-purple-500",
  "from-fuchsia-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-red-500",
  "from-cyan-500 to-blue-500",
];

/** Lucide Icon name for a department; falls back to a generic stethoscope. */
export function deptIcon(department) {
  return DEPT_ICON[department] || "Stethoscope";
}

/** Stable gradient class for a department, so a specialty always looks the same. */
export function deptGradient(department) {
  const key = department || "";
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

/** Human label for the hospital stay, or null when unknown. */
export function stayLabel(t) {
  if (!t?.days) return null;
  return `${t.days}-day stay`;
}

/** Procedure duration label, or null when unknown. */
export function durationLabel(t) {
  const d = (t?.duration || "").trim();
  return d || null;
}

/** First N sentences of a plain-text string, for short summaries. */
function firstSentences(text, n = 2) {
  if (!text) return "";
  const parts = String(text).replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+|\S+$/g) || [];
  return parts.slice(0, n).join(" ").trim();
}

/**
 * Derive an FAQ list from the treatment's real fields. Cost is intentionally
 * answered with a "request an estimate" CTA because the snapshot's cost numbers
 * are placeholders, not real prices. Entries with no answer are dropped.
 */
export function buildFaqs(t) {
  if (!t) return [];
  const name = t.name;
  const dur = durationLabel(t);
  const faqs = [
    {
      q: `What is ${name}?`,
      a: firstSentences(t.description || t.shortDescription, 3),
    },
    {
      q: `Which specialty performs ${name}?`,
      a: t.department
        ? `${name} is handled by the ${t.department} department. Healtour matches you to an accredited hospital and a credentialed specialist for your case.`
        : `Healtour matches you to the right accredited hospital and credentialed specialist for ${name}.`,
    },
    {
      q: `How long does ${name} take?`,
      a: dur ? `The procedure typically takes around ${dur}. Exact timing depends on your individual case and the treating hospital.` : "",
    },
    {
      q: `How many days will I stay in hospital?`,
      a: t.days ? `Plan for an indicative ${t.days}-day hospital stay. Your care team confirms the exact duration after evaluation.` : "",
    },
    {
      q: `How much does ${name} cost?`,
      a: `Costs vary by hospital, city and individual case. Healtour gives you a free, itemised cost estimate up front — request one through the chat or on WhatsApp so there are no surprises.`,
    },
    {
      q: `Can Healtour arrange ${name} abroad?`,
      a: `Yes. Healtour coordinates the full journey for ${name} — hospital matching, transparent cost estimates, visa and document guidance, travel and recovery support.`,
    },
  ];
  return faqs.filter((f) => f.a && f.a.trim());
}

/**
 * Light sanitizer for first-party CMS HTML (treatment bodies are shipped in our
 * own bundle, not user input). Strips script/style/iframe blocks, inline event
 * handlers and javascript: URLs as defense-in-depth before dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<\s*(script|style|iframe|object|embed)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed)\b[^>]*\/?\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}
