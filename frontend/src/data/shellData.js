// ---------------------------------------------------------------------------
// Healtour — shared application-shell content (Navbar, Footer, Hero search).
//
// Static, illustrative data for the marketing/navigation shell only. Specialty,
// treatment and hospital names/slugs mirror the real content snapshot in
// src/data/healtour/* so the shell links are forward-compatible with the
// directory pages added in a later phase. Destination routes (e.g.
// /specialties, /treatments, /hospitals) do not exist yet and currently fall
// through to the catch-all redirect — that is expected for this phase.
//
// NOTE: contact details, phone and WhatsApp numbers below are PLACEHOLDERS —
// replace with Healtour Solutions Pvt Ltd's real values before launch.
// ---------------------------------------------------------------------------

// --- Company / contact -------------------------------------------------------

export const CONTACT = {
  company: "Healtour Solutions Pvt Ltd",
  tagline: "Click. Fly. Heal.",
  phone: "+91 80000 00000",
  phoneHref: "tel:+918000000000",
  whatsapp: "918000000000", // digits only, country code first — used by wa.me
  whatsappMessage:
    "Hi Healtour, I'd like help planning my medical treatment journey.",
  email: "care@healtour.com",
  emailHref: "mailto:care@healtour.com",
  address: "Hyderabad, Telangana, India",
  hours: "Mon–Sat · 9:00 AM – 7:00 PM IST",
};

/** Build a wa.me deep link with an optional pre-filled message. */
export const whatsappLink = (message) =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    message || CONTACT.whatsappMessage,
  )}`;

// --- Social links ------------------------------------------------------------

export const SOCIAL_LINKS = [
  { label: "Facebook", icon: "Facebook", href: "https://facebook.com/" },
  { label: "Instagram", icon: "Instagram", href: "https://instagram.com/" },
  { label: "LinkedIn", icon: "Linkedin", href: "https://linkedin.com/" },
  { label: "YouTube", icon: "Youtube", href: "https://youtube.com/" },
  { label: "X", icon: "Twitter", href: "https://x.com/" },
];

// --- Specialties (mirrors departments.json showOnHome) -----------------------

export const SPECIALTIES = [
  { name: "Cardiology", slug: "cardiology", icon: "HeartPulse" },
  { name: "Neurology", slug: "neurology", icon: "Brain" },
  { name: "Neurosurgery", slug: "neurosurgery", icon: "Brain" },
  { name: "Oncology", slug: "oncology", icon: "Microscope" },
  { name: "Orthopaedics", slug: "orthopaedics", icon: "Bone" },
  { name: "Gastroenterology", slug: "gastroenterology", icon: "Pill" },
  { name: "Urology", slug: "urology", icon: "Droplets" },
  { name: "Hepatology", slug: "hepatology", icon: "Activity" },
  { name: "Gynaecology", slug: "gynaecology", icon: "Baby" },
  { name: "Pulmonology", slug: "pulmonology", icon: "Wind" },
  { name: "Endocrinology", slug: "endocrinology", icon: "Activity" },
  { name: "Plastic Surgery", slug: "plastic-surgery", icon: "Scissors" },
];

// --- Treatments (mirrors treatments.json) ------------------------------------
// Grouped for the mega menu: one column per care area.

export const TREATMENT_GROUPS = [
  {
    title: "Cardiac & Vascular",
    items: [
      { name: "Coronary Bypass (CABG)", slug: "coronary-artery-bypass-grafting-cabg-" },
      { name: "Heart Valve Surgery", slug: "heart-valve-surgery" },
      { name: "Angioplasty & Stenting", slug: "angioplasty-stenting" },
    ],
  },
  {
    title: "Cancer Care",
    items: [
      { name: "Chemotherapy", slug: "chemotherapy" },
      { name: "Radiation Therapy", slug: "radiation-therapy-" },
      { name: "Bone Marrow Transplant", slug: "bone-marrow-transplant" },
    ],
  },
  {
    title: "Orthopaedics",
    items: [
      { name: "Joint Replacement", slug: "joint-replacement-knee-hip-shoulder-" },
      { name: "Hip Replacement", slug: "hipreplacement" },
      { name: "Spine Surgery", slug: "spine-surgery" },
    ],
  },
  {
    title: "Neuro & Transplants",
    items: [
      { name: "Deep Brain Stimulation (DBS)", slug: "deep-brain-stimulation-dbs-" },
      { name: "Liver Transplantation", slug: "liver-transplantation" },
      { name: "Kidney Transplantation", slug: "kidney-transplantation" },
    ],
  },
];

// Flat list of popular treatments for search suggestions / quick links.
export const POPULAR_TREATMENTS = TREATMENT_GROUPS.flatMap((g) => g.items).slice(0, 8);

// --- Hospitals (mirrors hospitals.json) --------------------------------------

export const HOSPITALS_NAV = [
  { name: "Apollo Hospital", slug: "apollo-hospital", city: "Hyderabad" },
  { name: "Fortis Hospital", slug: "fortis-hospital-ltd", city: "Bangalore" },
  { name: "MGM Healthcare", slug: "mgm-healthcare", city: "Chennai" },
  { name: "TX Hospitals", slug: "txhospitals", city: "Hyderabad" },
  { name: "SRM Institutes (SIMS)", slug: "srm-siims", city: "Chennai" },
  { name: "Royal Care Super Speciality", slug: "royal-care-super-speciality-hospital-limited", city: "Coimbatore" },
];

// --- Resource links ----------------------------------------------------------

export const RESOURCE_LINKS = [
  { label: "Health Blog", href: "/blog", icon: "FileText" },
  { label: "Patient Stories", href: "/stories", icon: "Quote" },
  { label: "Wellness Packages", href: "/wellness", icon: "Leaf" },
  { label: "Get a Free Opinion", href: "/opinion", icon: "Stethoscope" },
  { label: "Become a Partner", href: "/partner", icon: "ShieldCheck" },
  { label: "Contact Us", href: "/contact", icon: "Mail" },
  { label: "How It Works", href: "/#how-it-works", icon: "Route" },
  { label: "About Healtour", href: "/#about", icon: "Building2" },
];

// --- Top-level navigation ----------------------------------------------------
// `type` drives how the Navbar renders each item.

export const PRIMARY_NAV = [
  { label: "Specialties", type: "specialties" },
  { label: "Treatments", type: "treatments" },
  { label: "Hospitals", type: "link", href: "/hospitals" },
  { label: "Doctors", type: "link", href: "/doctors" },
  { label: "Resources", type: "resources" },
];
