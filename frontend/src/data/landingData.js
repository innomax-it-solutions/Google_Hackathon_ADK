// ---------------------------------------------------------------------------
// Healtour — static landing page content.
// All data here is dummy/illustrative for the marketing UI only. No backend,
// no API calls. Swap these arrays for real data later without touching the UI.
// ---------------------------------------------------------------------------

export const NAV_LINKS = [
  { label: "Hospitals", href: "#hospitals" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Services", href: "#features" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "About Us", href: "#about" },
  { label: "Contact Us", href: "#contact" },
];

export const ABOUT_HEALTOUR = {
  description:
    "Healtour is an AI-powered medical tourism platform that simplifies international healthcare journeys by helping patients connect with trusted hospitals, transparent treatment costs, and end-to-end travel coordination.",
  ecosystem: "Part of the Innomax Skills ecosystem.",
  highlights: [
    {
      icon: "Globe",
      title: "Global Hospital Network",
      description: "Trusted hospitals across the world",
    },
    {
      icon: "Sparkles",
      title: "AI-Powered Coordination",
      description: "Smart recommendations for better outcomes",
    },
    {
      icon: "Route",
      title: "End-to-End Support",
      description: "From planning to recovery, we're with you",
    },
  ],
};

export const HERO_STATS = [
  { icon: "Building2", value: "22+", label: "Hospital Partners", subtitle: "Trusted network" },
  { icon: "Globe", value: "15+", label: "Countries Supported", subtitle: "Global reach" },
  {
    icon: "Sparkles",
    value: "AI",
    label: "Powered Coordination",
    subtitle: "Intelligent & automated",
    accent: true,
  },
  {
    icon: "Users",
    value: "End-to-End",
    label: "Patient Guidance",
    subtitle: "From inquiry to arrival",
  },
];

// Floating cards shown over the hero mock dashboard
export const HERO_FLOATING_CARDS = [
  { icon: "ShieldCheck", title: "JCI Accredited", subtitle: "Verified network" },
  { icon: "Clock", title: "Plan in seconds", subtitle: "Instant journey plan" },
  { icon: "CircleDollarSign", title: "Save up to 70%", subtitle: "vs. home country" },
];

export const HOSPITALS = [
  {
    name: "Apollo Hospitals",
    initials: "AP",
    color: "from-blue-500 to-indigo-500",
    location: "Chennai, India",
    rating: 4.9,
    reviews: "12.4k",
    specialties: ["Cardiology", "Oncology", "Orthopedics"],
    description:
      "Asia's largest integrated healthcare group, pioneering robotic and minimally invasive surgery.",
    accreditation: "JCI · NABH",
  },
  {
    name: "Fortis Healthcare",
    initials: "FH",
    color: "from-sky-500 to-cyan-500",
    location: "Gurugram, India",
    rating: 4.8,
    reviews: "9.1k",
    specialties: ["Cardiac Sciences", "Neurology", "Transplants"],
    description:
      "Renowned multi-specialty network with world-class cardiac and neuro programs.",
    accreditation: "JCI · NABH",
  },
  {
    name: "Yashoda Hospitals",
    initials: "YH",
    color: "from-teal-500 to-emerald-500",
    location: "Hyderabad, India",
    rating: 4.7,
    reviews: "7.6k",
    specialties: ["Oncology", "Neurosciences", "Robotic Surgery"],
    description:
      "Advanced tertiary care with cutting-edge oncology and precision robotic surgery suites.",
    accreditation: "NABH · NABL",
  },
  {
    name: "Rainbow Children's",
    initials: "RC",
    color: "from-fuchsia-500 to-pink-500",
    location: "Hyderabad, India",
    rating: 4.8,
    reviews: "5.2k",
    specialties: ["Pediatrics", "Neonatology", "Fetal Medicine"],
    description:
      "India's leading children's & women's hospital network with dedicated NICU expertise.",
    accreditation: "NABH",
  },
  {
    name: "Rela Hospital",
    initials: "RL",
    color: "from-violet-500 to-purple-500",
    location: "Chennai, India",
    rating: 4.9,
    reviews: "4.8k",
    specialties: ["Liver Transplant", "Hepatobiliary", "Nephrology"],
    description:
      "Global center of excellence for liver disease and multi-organ transplantation.",
    accreditation: "JCI · NABH",
  },
  {
    name: "Gleneagles BGS",
    initials: "GB",
    color: "from-amber-500 to-orange-500",
    location: "Bengaluru, India",
    rating: 4.7,
    reviews: "6.3k",
    specialties: ["Multi-organ Transplant", "Cardiology", "Gastro"],
    description:
      "Part of the global Gleneagles group, trusted for complex transplant and cardiac care.",
    accreditation: "JCI · NABH",
  },
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "ClipboardList",
    title: "Share your needs",
    description:
      "Tell the agent your condition, budget, country, and timeline. No paperwork, no calls.",
  },
  {
    step: "02",
    icon: "Sparkles",
    title: "AI matches hospitals",
    description:
      "The agent reasons over an accredited network to shortlist the best-fit hospitals for you.",
  },
  {
    step: "03",
    icon: "Calculator",
    title: "Get a cost estimate",
    description:
      "Receive an itemised, transparent treatment estimate in your currency — no hidden fees.",
  },
  {
    step: "04",
    icon: "Route",
    title: "Receive your journey plan",
    description:
      "A complete plan: hospital, costs, visa & document checklist, and travel timeline.",
  },
];

export const AI_FEATURES = [
  {
    icon: "BrainCircuit",
    title: "Intelligent Hospital Matching",
    description:
      "Gemini reasons over conditions, budget, and outcomes to recommend the right hospital — not just the nearest.",
  },
  {
    icon: "Wallet",
    title: "Transparent Cost Estimation",
    description:
      "Itemised treatment packages in USD and local currency, so there are never any surprises.",
  },
  {
    icon: "FileCheck2",
    title: "Visa & Document Guidance",
    description:
      "Country-specific visa types, processing times, and a precise medical-document checklist.",
  },
  {
    icon: "LayoutGrid",
    title: "Multi-Hospital Comparison",
    description:
      "Compare shortlisted hospitals side by side on cost, specialty, accreditation, and rating.",
  },
  {
    icon: "Map",
    title: "AI Patient Journey Planning",
    description:
      "An end-to-end plan from first enquiry to recovery — sequenced, scheduled, and stress-free.",
  },
  {
    icon: "Network",
    title: "Real Hospital Network Integration",
    description:
      "Built on a verified network of JCI & NABH accredited partner hospitals across India.",
  },
];

// Interactive patient journey preview (fake AI-generated report)
export const JOURNEY_PREVIEW = {
  patient: {
    label: "Patient request",
    query: "Cardiac surgery (CABG) from Kenya",
    profile: ["From: Nairobi, Kenya 🇰🇪", "Budget: $12,000", "Timeline: 4 weeks"],
  },
  recommended: [
    {
      name: "Apollo Hospitals",
      city: "Chennai",
      match: 96,
      tag: "Best match",
    },
    {
      name: "Fortis Healthcare",
      city: "Gurugram",
      match: 91,
      tag: "Strong fit",
    },
  ],
  cost: {
    procedure: "Coronary Artery Bypass Graft (CABG)",
    range: "$8,400 – $10,200",
    savings: "≈ 68% vs. private care at home",
    items: [
      { label: "Surgeon & anesthesia", value: "$3,100" },
      { label: "Hospital stay (6 nights)", value: "$2,600" },
      { label: "Diagnostics & meds", value: "$1,500" },
      { label: "Post-op & follow-up", value: "$1,200" },
    ],
  },
  checklist: [
    "Valid passport (6+ months)",
    "Medical Visa (e-Visa eligible)",
    "Recent angiography report",
    "Doctor's referral letter",
  ],
  timeline: [
    { day: "Day 0", event: "Arrival & pre-op evaluation" },
    { day: "Day 2", event: "CABG surgery" },
    { day: "Day 3–6", event: "ICU & recovery" },
    { day: "Day 10", event: "Discharge & fit-to-fly" },
  ],
  summary:
    "Apollo Chennai is the strongest match for budget and cardiac outcomes. Estimated package fits within budget with ~68% savings. Medical e-Visa is straightforward for Kenyan nationals; plan ~3 days lead time.",
};

export const COMPARISON = {
  traditional: {
    title: "Traditional Process",
    points: [
      "Weeks of manual coordination across agents",
      "Hidden costs revealed only at the hospital",
      "Confusing, country-specific visa rules",
      "Slow, inconsistent hospital responses",
      "Multiple disconnected touchpoints",
    ],
  },
  healtour: {
    title: "Healtour AI",
    points: [
      "A complete journey plan in seconds",
      "Itemised, transparent cost estimates upfront",
      "Clear visa & document checklist per country",
      "Instant, accredited hospital matching",
      "One intelligent agent, one seamless flow",
    ],
  },
};

// Visual-only architecture representation
export const ARCHITECTURE = {
  flow: [
    {
      icon: "MonitorSmartphone",
      title: "Frontend",
      subtitle: "Patient experience",
      description: "React + Tailwind UI where patients describe their needs.",
    },
    {
      icon: "Bot",
      title: "ADK Agent",
      subtitle: "Reasoning core",
      description: "Gemini-powered agent that decides which tools to call, and when.",
    },
    {
      icon: "Wrench",
      title: "MCP Tools",
      subtitle: "Capabilities",
      description: "Specialised tools the agent orchestrates to build the plan.",
    },
  ],
  tools: [
    { icon: "Hospital", title: "Hospital Match Tool", description: "Matches condition + budget to accredited hospitals." },
    { icon: "Calculator", title: "Cost Estimator Tool", description: "Builds itemised treatment cost estimates." },
    { icon: "FileCheck2", title: "Document Checklist Tool", description: "Generates visa & document requirements by country." },
  ],
  stack: ["Google ADK", "Claude Sonnet", "MCP Tooling", "Google Cloud Run"],
};

export const TESTIMONIALS = [
  {
    name: "Amara Okafor",
    country: "Nigeria 🇳🇬",
    treatment: "Knee Replacement",
    initials: "AO",
    color: "from-blue-500 to-indigo-500",
    quote:
      "Healtour planned everything — hospital, costs, even my visa checklist — in one go. I arrived in India knowing exactly what to expect.",
  },
  {
    name: "Daniel Mwangi",
    country: "Kenya 🇰🇪",
    treatment: "Cardiac Surgery",
    initials: "DM",
    color: "from-teal-500 to-cyan-500",
    quote:
      "The cost estimate was spot on and saved my family weeks of back-and-forth. The journey plan felt like having a personal coordinator.",
  },
  {
    name: "Fatima Al-Rashid",
    country: "UAE 🇦🇪",
    treatment: "Oncology Care",
    initials: "FA",
    color: "from-violet-500 to-fuchsia-500",
    quote:
      "I compared three hospitals side by side in minutes. Transparent, reassuring, and genuinely intelligent guidance.",
  },
  {
    name: "James Carter",
    country: "United Kingdom 🇬🇧",
    treatment: "Spine Surgery",
    initials: "JC",
    color: "from-amber-500 to-orange-500",
    quote:
      "World-class care at a fraction of the cost, with zero guesswork. Healtour handled the complexity so I could focus on recovery.",
  },
];

export const FOOTER = {
  tagline: "AI-powered medical tourism coordination platform.",
  explore: [
    { label: "Hospitals", href: "#hospitals" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Resources", href: "#journey" },
  ],
  contact: {
    address:
      "Healtour Solutions Pvt Ltd 805B, Nanjappa Majestic Commercial, JNTU Rd, Kukatpally, Housing Board Colony, Hyderabad, Telangana - 500072, India",
    email: "info@healtourin.com",
    phone: "+91 92811 11724",
  },
};
