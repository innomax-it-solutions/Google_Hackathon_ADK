/**
 * Question/option config for the clarification popup (the agent only sends which
 * fields are missing; the UI owns the questions + suggested options).
 */

export const CLARIFY_FIELDS = {
  condition: {
    question: "What treatment or procedure do you need?",
    options: [
      { label: "Knee replacement", value: "knee replacement" },
      { label: "Heart bypass (CABG)", value: "heart bypass" },
      { label: "Cataract surgery", value: "cataract surgery" },
      { label: "Kidney transplant", value: "kidney transplant" },
      { label: "Cancer / chemotherapy", value: "chemotherapy" },
    ],
    custom: { placeholder: "Describe your condition…", type: "text" },
    optional: false,
  },
  origin_country: {
    question: "Which country are you travelling from?",
    options: [
      { label: "United Arab Emirates", value: "AE" },
      { label: "United States", value: "US" },
      { label: "United Kingdom", value: "GB" },
      { label: "Nigeria", value: "NG" },
      { label: "Bangladesh", value: "BD" },
      { label: "Saudi Arabia", value: "SA" },
    ],
    custom: { placeholder: "Type your country…", type: "text" },
    optional: false,
  },
  budget_usd: {
    question: "What's your budget? (USD)",
    options: [
      { label: "Up to $5,000", value: "5000" },
      { label: "Around $10,000", value: "10000" },
      { label: "Around $20,000", value: "20000" },
      { label: "$50,000 or more", value: "50000" },
    ],
    custom: { placeholder: "Enter an amount in USD…", type: "number" },
    optional: true,
  },
  timeline_weeks: {
    question: "How soon do you need treatment?",
    options: [
      { label: "Within 2 weeks", value: "2" },
      { label: "Within 6 weeks", value: "6" },
      { label: "Within 3 months", value: "12" },
    ],
    custom: { placeholder: "Number of weeks…", type: "number" },
    optional: true,
  },
  interpreter_language: {
    question: "Do you need a language interpreter?",
    options: [
      { label: "No, English is fine", value: "" },
      { label: "Arabic", value: "ar" },
      { label: "French", value: "fr" },
      { label: "Spanish", value: "es" },
      { label: "Mandarin Chinese", value: "zh" },
    ],
    custom: { placeholder: "Another language…", type: "text" },
    optional: true,
  },
  // --- Travel / flights ---
  departure_city: {
    question: "Which city will you fly from?",
    options: [
      { label: "Dubai (DXB)", value: "DXB" },
      { label: "Abu Dhabi (AUH)", value: "AUH" },
      { label: "London (LHR)", value: "LHR" },
      { label: "Lagos (LOS)", value: "LOS" },
      { label: "Dhaka (DAC)", value: "DAC" },
      { label: "Riyadh (RUH)", value: "RUH" },
    ],
    custom: { placeholder: "City or airport code…", type: "text" },
    optional: true,
  },
  travel_date: {
    question: "When do you plan to travel?",
    options: [
      { label: "As soon as possible", value: "as soon as possible" },
      { label: "In 2–4 weeks", value: "in 2 to 4 weeks" },
      { label: "In 1–2 months", value: "in 1 to 2 months" },
    ],
    custom: { placeholder: "A date, e.g. 2026-08-15…", type: "text" },
    optional: true,
  },
  travellers: {
    question: "How many people are travelling?",
    options: [
      { label: "Just me", value: "1" },
      { label: "2 (with a companion)", value: "2" },
      { label: "3", value: "3" },
      { label: "4 or more", value: "4" },
    ],
    custom: { placeholder: "Number of travellers…", type: "number" },
    optional: true,
  },
};

// Canonical order the questions are asked in.
export const CLARIFY_ORDER = [
  "condition", "origin_country", "budget_usd", "timeline_weeks", "interpreter_language",
  "departure_city", "travel_date", "travellers",
];
