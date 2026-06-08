/**
 * Treatment catalog for the Hospital Finder form.
 *
 * Mirrors the procedure slugs in backend/data/cost_matrix.json (the source of
 * truth for what hospitals actually price). The `value` is the exact slug the
 * backend's find_hospitals._resolve() matches directly, so selecting an option
 * gives a deterministic hospital + cost match (no free-text guessing).
 *
 * Grouped by specialty for the searchable dropdown. `keywords` widen search so a
 * patient typing a lay term ("piles", "weight loss", "brain tumour") still finds
 * the clinical procedure.
 */

export const TREATMENT_GROUPS = [
  {
    specialty: "Cardiac / Heart",
    options: [
      { value: "cabg", label: "Heart Bypass (CABG)", keywords: "coronary bypass open heart surgery" },
      { value: "angioplasty-one-stent", label: "Angioplasty (one stent)", keywords: "stent blockage" },
      { value: "coronary-angiogram", label: "Coronary Angiogram", keywords: "diagnostic dye" },
      { value: "valve-replacement-mvr", label: "Mitral Valve Replacement (MVR)", keywords: "heart valve" },
      { value: "valve-replacement", label: "Heart Valve Replacement", keywords: "aortic valve" },
      { value: "pacemaker-single-chamber", label: "Pacemaker (single chamber)", keywords: "rhythm" },
      { value: "pacemaker-dual-chamber", label: "Pacemaker (dual chamber)", keywords: "rhythm" },
      { value: "rfa-ablation", label: "Cardiac RFA Ablation", keywords: "arrhythmia rhythm" },
    ],
  },
  {
    specialty: "Orthopaedics",
    options: [
      { value: "knee-replacement-unilateral", label: "Knee Replacement (one knee)", keywords: "total knee joint" },
      { value: "knee-replacement-bilateral", label: "Knee Replacement (both knees)", keywords: "total knee joint" },
      { value: "hip-replacement-unilateral", label: "Hip Replacement (one hip)", keywords: "joint" },
      { value: "hip-replacement-bilateral", label: "Hip Replacement (both hips)", keywords: "joint" },
      { value: "shoulder-replacement", label: "Shoulder Replacement", keywords: "joint" },
      { value: "acl-reconstruction", label: "ACL Reconstruction (knee ligament)", keywords: "ligament tear sports" },
      { value: "spine-fixation", label: "Spinal Fusion / Fixation", keywords: "back spine" },
      { value: "orif-fracture", label: "Fracture Fixation (ORIF)", keywords: "broken bone plate" },
    ],
  },
  {
    specialty: "Oncology / Cancer",
    options: [
      { value: "chemotherapy-basic", label: "Chemotherapy", keywords: "cancer chemo" },
      { value: "imrt-radiation", label: "Radiation Therapy (IMRT)", keywords: "cancer radiotherapy" },
      { value: "bone-marrow-transplant-auto", label: "Bone Marrow Transplant (autologous)", keywords: "cancer leukaemia bmt" },
      { value: "bone-marrow-transplant-allo", label: "Bone Marrow Transplant (allogeneic)", keywords: "cancer leukaemia bmt" },
      { value: "liver-transplant", label: "Liver Transplant", keywords: "cancer organ" },
      { value: "whipple-procedure", label: "Whipple Procedure (pancreatic)", keywords: "pancreas cancer" },
      { value: "hipec-crs", label: "HIPEC with Cytoreductive Surgery", keywords: "abdominal cancer" },
    ],
  },
  {
    specialty: "Urology",
    options: [
      { value: "kidney-transplant", label: "Kidney Transplant", keywords: "renal organ" },
      { value: "dialysis", label: "Dialysis", keywords: "renal kidney" },
      { value: "pcnl-unilateral", label: "Kidney Stone Removal (PCNL, one side)", keywords: "stones renal" },
      { value: "pcnl-bilateral", label: "Kidney Stone Removal (PCNL, both sides)", keywords: "stones renal" },
      { value: "turp", label: "Enlarged Prostate Surgery (TURP)", keywords: "prostate bph" },
      { value: "prostate-removal-turp", label: "Prostate Removal (TURP)", keywords: "prostate" },
      { value: "radical-prostatectomy", label: "Prostate Removal (radical, cancer)", keywords: "prostate cancer" },
    ],
  },
  {
    specialty: "Neurosurgery",
    options: [
      { value: "craniotomy", label: "Brain Surgery (Craniotomy)", keywords: "brain tumour tumor" },
      { value: "craniotomy-neuro-navigation", label: "Craniotomy (neuro-navigation)", keywords: "brain tumour" },
      { value: "craniotomy-haematoma", label: "Craniotomy (haematoma)", keywords: "brain bleed clot" },
      { value: "micro-lumbar-discectomy", label: "Slipped Disc Surgery (microdiscectomy)", keywords: "back spine herniated" },
      { value: "laminectomy", label: "Laminectomy (spinal)", keywords: "back spine" },
      { value: "spine-decompression", label: "Spinal Decompression", keywords: "back spine" },
      { value: "tlif-1-level", label: "Spinal Fusion TLIF (1 level)", keywords: "back spine" },
      { value: "vp-shunt", label: "VP Shunt (hydrocephalus)", keywords: "brain fluid" },
    ],
  },
  {
    specialty: "General Surgery",
    options: [
      { value: "laparoscopic-cholecystectomy", label: "Gallbladder Removal (laparoscopic)", keywords: "gall bladder stones" },
      { value: "lap-inguinal-hernia-repair", label: "Hernia Repair (laparoscopic, inguinal)", keywords: "hernia" },
      { value: "appendicectomy", label: "Appendix Removal (Appendicectomy)", keywords: "appendicitis appendix" },
      { value: "appendicectomy-lap", label: "Appendix Removal (laparoscopic)", keywords: "appendicitis" },
      { value: "haemorrhoidectomy", label: "Haemorrhoid Surgery (piles)", keywords: "piles hemorrhoids" },
      { value: "sleeve-gastrectomy", label: "Gastric Sleeve (weight loss)", keywords: "bariatric weight obesity" },
      { value: "gastric-bypass", label: "Gastric Bypass (weight loss)", keywords: "bariatric weight obesity" },
      { value: "mastectomy-simple", label: "Mastectomy (simple)", keywords: "breast cancer" },
    ],
  },
  {
    specialty: "Gynaecology",
    options: [
      { value: "ivf-treatment", label: "IVF / Fertility Treatment", keywords: "fertility conceive" },
      { value: "laparoscopic-hysterectomy", label: "Hysterectomy (laparoscopic)", keywords: "uterus womb" },
      { value: "hysterectomy-open", label: "Hysterectomy (open)", keywords: "uterus womb" },
      { value: "lavh", label: "Vaginal Hysterectomy (LAVH)", keywords: "uterus womb" },
      { value: "laparoscopic-myomectomy", label: "Fibroid Removal (laparoscopic)", keywords: "fibroid uterus" },
      { value: "laparoscopic-cystectomy", label: "Ovarian Cyst Removal (laparoscopic)", keywords: "ovary cyst" },
    ],
  },
  {
    specialty: "ENT (Ear, Nose & Throat)",
    options: [
      { value: "fess-bilateral", label: "Sinus Surgery (FESS, bilateral)", keywords: "sinus nose" },
      { value: "septoplasty", label: "Septoplasty (deviated septum)", keywords: "nose septum" },
      { value: "tonsillectomy", label: "Tonsillectomy", keywords: "tonsil throat" },
      { value: "tympanoplasty", label: "Tympanoplasty (eardrum repair)", keywords: "ear eardrum" },
      { value: "tympanoplasty-mastoidectomy", label: "Tympanoplasty with Mastoidectomy", keywords: "ear" },
    ],
  },
  {
    specialty: "Ophthalmology / Eye",
    options: [
      { value: "cataract-surgery-monofocal", label: "Cataract Surgery (monofocal)", keywords: "eye lens" },
      { value: "cornea-transplant", label: "Cornea Transplant", keywords: "eye" },
      { value: "retinal-detachment-repair", label: "Retinal Detachment Repair", keywords: "eye retina" },
      { value: "vitrectomy", label: "Vitrectomy", keywords: "eye retina" },
    ],
  },
];

// Flat lookup: slug -> friendly label (for echoing the selection back).
export const TREATMENT_LABELS = Object.fromEntries(
  TREATMENT_GROUPS.flatMap((g) => g.options.map((o) => [o.value, o.label]))
);
