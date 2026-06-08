/**
 * journeyPlanPdf.js — render a MedBridge Journey Plan to a clean, branded PDF.
 *
 * Built from the SAME structured tool data the JourneyPlanCard renders (intake,
 * the selected hospital's estimate_cost, the picked flight, the visa checklist,
 * the AI summary) — NOT a screenshot — so the export has selectable text and
 * print-quality layout regardless of theme or screen size.
 *
 * The small presentational helpers (fmtUsd, range, buildTimeline, …) deliberately
 * mirror the pure helpers in JourneyPlanCard.jsx so the PDF reads identically to
 * the on-screen card. Keep them in sync if the card's formatting changes.
 */

import { jsPDF } from "jspdf";
import { COUNTRIES } from "../../constants/countries";
import { MEDBRIDGE_TRANSLATOR_LANGUAGES, languageName } from "../../constants/languages";

const COUNTRY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));

// --- palette (RGB) ---------------------------------------------------------
const INK      = [31, 41, 55];    // slate-800  — primary text
const MUTED    = [107, 114, 128]; // slate-500  — secondary text
const FAINT     = [156, 163, 175]; // slate-400 — tertiary / notes
const ACCENT   = [79, 70, 229];   // indigo-600 — brand
const ACCENT_DK = [67, 56, 202];  // indigo-700
const HAIRLINE = [229, 231, 235]; // slate-200  — dividers
const PANEL_BG = [248, 250, 252]; // slate-50   — section fills
const WHITE    = [255, 255, 255];
const GREEN    = [16, 185, 129];
const AMBER    = [217, 119, 6];

// --- page geometry (A4, points) --------------------------------------------
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 44;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Build and trigger a download of the Journey Plan PDF. */
export function downloadJourneyPlanPdf(plan) {
  const doc = buildJourneyPlanPdf(plan);
  doc.save(planFilename(plan));
}

function planFilename(plan) {
  const cond = (plan?.intake?.condition || "journey-plan")
    .toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  const d = new Date();
  const stamp = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  return `MedBridge-Journey-Plan-${cond || "plan"}-${stamp}.pdf`;
}

export function buildJourneyPlanPdf(plan = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const ctx = { doc, y: 0 };

  drawBrandHeader(ctx, plan);
  drawPatientStrip(ctx, plan);

  drawHospitalSection(ctx, plan);
  drawCostSection(ctx, plan);
  drawFinalEstimate(ctx, plan);
  drawFlightsSection(ctx, plan);
  drawChecklistSection(ctx, plan);
  drawTimelineSection(ctx, plan);
  drawCompareSection(ctx, plan);
  drawSummarySection(ctx, plan);

  drawFooters(doc);
  return doc;
}

// ---------------------------------------------------------------------------
// Header + patient strip
// ---------------------------------------------------------------------------

function drawBrandHeader({ doc }, plan) {
  const bandH = 70;
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, PAGE_W, bandH, "F");

  // Logo mark
  doc.setFillColor(...WHITE);
  doc.roundedRect(MARGIN, 20, 30, 30, 7, 7, "F");
  doc.setTextColor(...ACCENT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("M", MARGIN + 15, 41, { align: "center" });

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("MedBridge — Journey Plan", MARGIN + 42, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(226, 232, 240);
  doc.text("Your medical-travel plan to India, prepared by Healtour Solutions", MARGIN + 42, 50);

  // Generated date (right-aligned)
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Generated ${longDate(new Date())}`, PAGE_W - MARGIN, 35, { align: "right" });

  const title = planTitle(plan);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text(truncate(doc, title, 240), PAGE_W - MARGIN, 50, { align: "right" });

  ctxSetY(doc, bandH + 22);
}

function drawPatientStrip({ doc }, plan) {
  const intake = plan?.intake || {};
  const cells = [
    ["Patient request", planTitle(plan)],
    ["From", countryLabel(intake.origin_country) || "—"],
    ["Budget", Number.isFinite(intake.budget_usd) && intake.budget_usd > 0 ? `$${intake.budget_usd.toLocaleString("en-US")}` : "Not set"],
    ["Timeline", Number.isFinite(intake.timeline_weeks) ? `${intake.timeline_weeks} weeks` : "—"],
  ];

  const boxH = 46;
  const y = curY(doc);
  doc.setFillColor(...PANEL_BG);
  doc.setDrawColor(...HAIRLINE);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 6, 6, "FD");

  // 4 columns: request title + from (wider, fits full country names) + budget + timeline.
  const widths = [0.32, 0.28, 0.2, 0.2].map((w) => w * CONTENT_W);
  let x = MARGIN + 14;
  cells.forEach(([label, value], i) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...FAINT);
    doc.text(label.toUpperCase(), x, y + 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(truncate(doc, value, widths[i] - 20), x, y + 33);
    x += widths[i];
  });

  ctxSetY(doc, y + boxH + 20);
}

// ---------------------------------------------------------------------------
// Recommended hospital
// ---------------------------------------------------------------------------

function drawHospitalSection({ doc }, plan) {
  const h = plan?.selectedHospital;
  if (!h) return;

  sectionHeading(doc, plan?.isRecommended === false ? "Selected hospital" : "Recommended hospital");

  ensureSpace(doc, 54);
  let y = curY(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  const nameLine = h.name || "Hospital";
  doc.text(truncate(doc, nameLine, CONTENT_W - 120), MARGIN, y + 4);

  // Recommended pill
  if (plan?.isRecommended !== false) {
    pill(doc, "RECOMMENDED", PAGE_W - MARGIN, y, "right");
  }
  y += 20;

  const meta = [h.city, h.state, h.tier ? `Tier ${h.tier}` : null, h.international_desk ? "International desk" : null]
    .filter(Boolean).join("  ·  ");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(meta || "Accredited hospital", MARGIN, y);
  y += 16;

  // Interpreter availability line (if a language was requested).
  const lang = plan?.supportLang;
  if (lang) {
    const has = Array.isArray(h.translator_languages) && h.translator_languages.includes(lang);
    const medbridge = MEDBRIDGE_TRANSLATOR_LANGUAGES.includes(lang);
    doc.setFontSize(9.5);
    (has ? drawCheck : drawCross)(doc, MARGIN, y, has ? GREEN : MUTED);
    doc.setTextColor(...(has ? GREEN : MUTED));
    doc.text(`${languageName(lang)} interpreter at this hospital — ${has ? "available" : "not listed"}`, MARGIN + 13, y);
    y += 13;
    (medbridge ? drawCheck : drawCross)(doc, MARGIN, y, medbridge ? GREEN : FAINT);
    doc.setTextColor(...(medbridge ? GREEN : FAINT));
    doc.text(`MedBridge interpreter (${languageName(lang)}) — ${medbridge ? "available" : "not available"}`, MARGIN + 13, y);
    y += 13;
  }

  if (plan?.hospitalStatus === "general_recommendation") {
    y = note(doc, y + 2, "Closest accredited options — we couldn't match your exact procedure. Your coordinator will confirm suitability.", AMBER);
  }

  ctxSetY(doc, y + 10);
}

// ---------------------------------------------------------------------------
// Estimated cost (line items)
// ---------------------------------------------------------------------------

function drawCostSection({ doc }, plan) {
  const cost = plan?.cost;
  if (!cost) return;

  sectionHeading(doc, "Estimated cost");

  if (cost.status === "unavailable") {
    ctxSetY(doc, note(doc, curY(doc), cost.message || "No listed price yet — your coordinator will get a quote for you.", AMBER) + 10);
    return;
  }

  const usd = range(cost.total_usd_min, cost.total_usd_max, fmtUsd);
  const inr = range(cost.total_inr_min, cost.total_inr_max, fmtInr);

  ensureSpace(doc, 50);
  let y = curY(doc);

  if (plan?.procedureLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(plan.procedureLabel, MARGIN, y);
    y += 16;
  }

  if (usd) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...INK);
    doc.text(usd, MARGIN, y + 6);
    y += 16;
    if (inr) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...FAINT);
      doc.text(inr, MARGIN, y + 4);
      y += 12;
    }
    y += 8;
  }

  const items = Array.isArray(cost.line_items) ? cost.line_items : [];
  if (items.length) {
    y = drawKeyValueTable(doc, y, items.map((it) => [it?.label || "Line item", fmtUsd(it?.usd) || "—"]));
  }

  if (cost.scope_note) {
    y = paragraph(doc, y + 4, cost.scope_note, { size: 8.5, color: FAINT });
  }
  if (cost.currency_note) {
    y = paragraph(doc, y + 2, cost.currency_note, { size: 8.5, color: FAINT, italic: true });
  }

  ctxSetY(doc, y + 12);
}

// ---------------------------------------------------------------------------
// Final estimate (treatment + flights vs budget) — highlighted band
// ---------------------------------------------------------------------------

function drawFinalEstimate({ doc }, plan) {
  const cost = plan?.cost;
  if (!cost || cost.status === "unavailable") return;
  const totalMin = cost.total_usd_min, totalMax = cost.total_usd_max;
  if (!Number.isFinite(totalMin) && !Number.isFinite(totalMax)) return;

  const includesFlights = !!cost.includes_flights;
  const flightItem = (cost.line_items || []).find((li) => li?.label === "Flights");
  const flightUsd = Number.isFinite(flightItem?.usd) ? flightItem.usd : null;
  const totalUsd = range(totalMin, totalMax, fmtUsd);
  const totalInr = range(cost.total_inr_min, cost.total_inr_max, fmtInr);

  const treatMin = Number.isFinite(totalMin) && flightUsd != null ? totalMin - flightUsd : totalMin;
  const treatMax = Number.isFinite(totalMax) && flightUsd != null ? totalMax - flightUsd : totalMax;
  const treatUsd = range(treatMin, treatMax, fmtUsd);

  const budget = Number.isFinite(plan?.intake?.budget_usd) && plan.intake.budget_usd > 0 ? plan.intake.budget_usd : null;
  const within = budget != null && Number.isFinite(totalMax) && totalMax <= budget;
  const overBy = budget != null && Number.isFinite(totalMax) && totalMax > budget ? totalMax - budget : 0;

  const boxH = includesFlights ? 86 : 70;
  ensureSpace(doc, boxH + 12);
  const y = curY(doc);

  doc.setFillColor(...ACCENT_DK);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 7, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(219, 222, 252);
  doc.text(`FINAL ESTIMATE  ·  ${includesFlights ? "TREATMENT + FLIGHTS" : "TREATMENT"}`, MARGIN + 16, y + 20);

  // Budget chip (right)
  let chip = "Best-value plan";
  if (budget != null) chip = within ? `Within your $${budget.toLocaleString("en-US")} budget`
                                    : `~$${Math.round(overBy).toLocaleString("en-US")} over your $${budget.toLocaleString("en-US")} budget`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const chipW = doc.getTextWidth(chip) + 16;
  doc.setFillColor(255, 255, 255);
  doc.setGState(new doc.GState({ opacity: 0.18 }));
  doc.roundedRect(PAGE_W - MARGIN - chipW - 16, y + 10, chipW, 16, 8, 8, "F");
  doc.setGState(new doc.GState({ opacity: 1 }));
  doc.setTextColor(...WHITE);
  doc.text(chip, PAGE_W - MARGIN - chipW - 8, y + 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text(totalUsd || "—", MARGIN + 16, y + 46);
  if (totalInr) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(219, 222, 252);
    doc.text(totalInr, MARGIN + 16, y + 60);
  }

  if (includesFlights) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(219, 222, 252);
    doc.text(`Treatment ${treatUsd || "—"}   +   Flights ${fmtUsd(flightUsd) || "—"}`, MARGIN + 16, y + boxH - 12);
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(199, 210, 254);
    doc.text("Treatment package only — flights and accommodation estimated separately.", MARGIN + 16, y + boxH - 10);
  }

  ctxSetY(doc, y + boxH + 18);
}

// ---------------------------------------------------------------------------
// Flights
// ---------------------------------------------------------------------------

function drawFlightsSection({ doc }, plan) {
  const flight = plan?.flight;
  if (!flight) return;

  sectionHeading(doc, "Flights");

  const directions = Array.isArray(flight.directions) && flight.directions.length ? flight.directions : [flight];
  const roundTrip = directions.length > 1;

  directions.forEach((dir, i) => {
    ensureSpace(doc, 34);
    let y = curY(doc);
    doc.setFillColor(...PANEL_BG);
    doc.setDrawColor(...HAIRLINE);
    doc.roundedRect(MARGIN, y, CONTENT_W, 30, 5, 5, "FD");

    const label = (dir?.label || (roundTrip && i > 0 ? "Return" : "Outbound")).toUpperCase();
    const day = fmtDay(dir?.departure);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...ACCENT);
    doc.text(`${label}${day ? `  ·  ${day}` : ""}`, MARGIN + 12, y + 13);

    // Route with a drawn arrow (from → to).
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    const fromT = sanitize(dir?.from || "—");
    const toT = sanitize(dir?.to || "—");
    doc.text(fromT, MARGIN + 12, y + 24);
    const fw = doc.getTextWidth(fromT);
    drawArrow(doc, MARGIN + 12 + fw + 7, y + 24, 12, INK);
    doc.text(toT, MARGIN + 12 + fw + 7 + 12 + 7, y + 24);

    const stops = Number.isFinite(dir?.stops)
      ? (dir.stops === 0 ? "non-stop" : `${dir.stops} stop${dir.stops > 1 ? "s" : ""}`) : null;
    const metaR = [stops, fmtDuration(dir?.duration_minutes)].filter(Boolean).join("  ·  ");
    if (metaR) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(metaR, PAGE_W - MARGIN - 12, y + 24, { align: "right" });
    }
    ctxSetY(doc, y + 30 + 8);
  });

  // Airfare line
  const fareItem = (plan?.cost?.line_items || []).find((li) => li?.label === "Flights");
  const fareUsd = fmtUsd(fareItem?.usd);
  const fareNative = Number.isFinite(flight.published_fare)
    ? `${flight.published_fare.toLocaleString("en-IN")} ${flight.currency || ""}`.trim() : null;
  if (fareUsd || fareNative) {
    let y = curY(doc);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(roundTrip ? "Round-trip airfare" : "Airfare", MARGIN, y);
    doc.setTextColor(...INK);
    const right = fareUsd && fareNative ? `${fareUsd}  (${fareNative})` : (fareUsd || fareNative);
    doc.text(right, PAGE_W - MARGIN, y, { align: "right" });
    ctxSetY(doc, y + 16);
  }
  ctxSetY(doc, curY(doc) + 8);
}

// ---------------------------------------------------------------------------
// Travel checklist (visa + docs)
// ---------------------------------------------------------------------------

function drawChecklistSection({ doc }, plan) {
  const docs = plan?.docs;
  if (!docs) return;

  sectionHeading(doc, "Travel checklist");

  const mandatory = Array.isArray(docs.mandatory_docs) ? docs.mandatory_docs : [];
  const recommended = Array.isArray(docs.recommended_docs) ? docs.recommended_docs : [];
  const visaItem = docs.visa_type ? `${docs.visa_type}${docs.visa_required === false ? " (visa-free)" : ""}` : null;
  const items = [visaItem, ...mandatory, ...recommended].filter(Boolean);

  if (!items.length) {
    ctxSetY(doc, paragraph(doc, curY(doc), "Your coordinator will confirm the exact documents for your country.", { size: 9.5, color: MUTED }) + 10);
    return;
  }

  // Two-column checklist.
  const colW = CONTENT_W / 2;
  const rowH = 16;
  const rows = Math.ceil(items.length / 2);
  ensureSpace(doc, rows * rowH + 10);
  const startY = curY(doc);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  items.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = MARGIN + col * colW;
    const y = startY + row * rowH;
    drawCheck(doc, x, y, GREEN);
    doc.setTextColor(...INK);
    doc.text(truncate(doc, item, colW - 28), x + 14, y);
  });

  let y = startY + rows * rowH + 4;
  if (Number.isFinite(docs.processing_days) || typeof docs.processing_days === "string") {
    const dur = `Visa processing ~ ${docs.processing_days}${Number.isFinite(docs.processing_days) ? " days" : ""}` +
      (Number.isFinite(docs.visa_duration_days) ? `  ·  valid ${docs.visa_duration_days} days` : "");
    doc.setFontSize(8.5);
    doc.setTextColor(...FAINT);
    doc.text(sanitize(dur), MARGIN, y + 6);
    y += 14;
  }
  if (docs.status === "fallback") {
    y = note(doc, y + 2, "General India checklist — confirm exact requirements with the destination embassy.", AMBER);
  }

  ctxSetY(doc, y + 12);
}

// ---------------------------------------------------------------------------
// Recovery timeline
// ---------------------------------------------------------------------------

function drawTimelineSection({ doc }, plan) {
  const cost = plan?.cost;
  if (!cost || cost.status === "unavailable") return;
  const steps = buildTimeline(cost, plan?.procedureLabel);
  if (!steps.length) return;

  sectionHeading(doc, "Recovery timeline");
  ensureSpace(doc, steps.length * 16 + 12);
  let y = curY(doc);

  steps.forEach((s, i) => {
    const last = i === steps.length - 1;
    // bullet
    doc.setFillColor(...(last ? GREEN : ACCENT));
    doc.circle(MARGIN + 3, y - 3, 2.4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...ACCENT);
    doc.text(s.day, MARGIN + 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.text(truncate(doc, s.label, CONTENT_W - 100), MARGIN + 80, y);
    y += 16;
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...FAINT);
  doc.text("Indicative recovery timeline.", MARGIN, y + 2);
  ctxSetY(doc, y + 16);
}

// ---------------------------------------------------------------------------
// Compare options
// ---------------------------------------------------------------------------

function drawCompareSection({ doc }, plan) {
  const list = Array.isArray(plan?.hospitalsList) ? plan.hospitalsList : [];
  if (list.length < 2) return;

  sectionHeading(doc, "Compare options");
  ensureSpace(doc, list.length * 18 + 10);
  const rows = list.map((h) => {
    const entry = plan?.cache?.[h?.hospital_id];
    const hasCost = entry?.cost && entry.cost.status !== "unavailable";
    const total = hasCost
      ? range(entry.cost.total_usd_min, entry.cost.total_usd_max, fmtUsd)
      : range(h?.est_usd_min, h?.est_usd_max, fmtUsd);
    const isRec = h?.hospital_id === plan?.recommendedId;
    const suffix = entry?.cost?.status === "unavailable"
      ? "No listed price"
      : (total ? total + (hasCost && entry?.cost?.includes_flights ? "  (incl. flights)" : (hasCost ? "" : " est.")) : "Accredited");
    return [`${h?.name || "Hospital"}${h?.city ? ` — ${h.city}` : ""}${isRec ? "  (recommended)" : ""}`, suffix];
  });
  ctxSetY(doc, drawKeyValueTable(doc, curY(doc), rows, { boldRight: true }) + 12);
}

// ---------------------------------------------------------------------------
// AI summary
// ---------------------------------------------------------------------------

function drawSummarySection({ doc }, plan) {
  const text = extractSummary(plan?.summary);
  if (!text) return;

  sectionHeading(doc, "AI recommendation summary");
  ensureSpace(doc, 40);
  let y = curY(doc);

  // Tinted panel sized to the wrapped text.
  const lines = doc.setFont("helvetica", "normal").setFontSize(9.5).splitTextToSize(text, CONTENT_W - 24);
  const boxH = lines.length * 13 + 18;
  ensureSpace(doc, boxH + 8);
  y = curY(doc);
  doc.setFillColor(238, 242, 255);   // indigo-50
  doc.setDrawColor(199, 210, 254);   // indigo-200
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 6, 6, "FD");
  doc.setTextColor(...INK);
  doc.text(lines, MARGIN + 12, y + 16);
  ctxSetY(doc, y + boxH + 14);
}

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

function curY(doc) { return doc.__y ?? MARGIN; }
function ctxSetY(doc, y) { doc.__y = y; }

// Add a page if the next block (height h) won't fit; reset cursor below the top margin.
function ensureSpace(doc, h) {
  if (curY(doc) + h > PAGE_H - 54) {
    doc.addPage();
    ctxSetY(doc, MARGIN + 6);
  }
}

function sectionHeading(doc, label) {
  ensureSpace(doc, 30);
  let y = curY(doc);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(2.5);
  doc.line(MARGIN, y - 8, MARGIN + 18, y - 8);
  doc.setLineWidth(1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT_DK);
  doc.text(label, MARGIN + 24, y - 4);
  // faint rule under heading
  doc.setDrawColor(...HAIRLINE);
  doc.line(MARGIN, y + 6, PAGE_W - MARGIN, y + 6);
  ctxSetY(doc, y + 22);
}

// A label↔value table with thin row dividers. Returns the new y.
// Honors the passed `y` (syncs the shared cursor to it) so callers tracking a
// local y don't collide with the cursor-based primitives.
function drawKeyValueTable(doc, y, rows, { boldRight = false } = {}) {
  ctxSetY(doc, y);
  doc.setFontSize(9.5);
  rows.forEach(([label, value]) => {
    ensureSpace(doc, 18);
    y = curY(doc);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(truncate(doc, label, CONTENT_W - 130), MARGIN, y + 4);
    doc.setFont("helvetica", boldRight ? "bold" : "normal");
    doc.setTextColor(...INK);
    doc.text(sanitize(value ?? "—"), PAGE_W - MARGIN, y + 4, { align: "right" });
    doc.setDrawColor(...HAIRLINE);
    doc.line(MARGIN, y + 10, PAGE_W - MARGIN, y + 10);
    ctxSetY(doc, y + 18);
  });
  return curY(doc);
}

function paragraph(doc, y, text, { size = 9.5, color = INK, italic = false } = {}) {
  ctxSetY(doc, y);
  doc.setFont("helvetica", italic ? "italic" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(sanitize(text), CONTENT_W);
  lines.forEach((ln) => {
    ensureSpace(doc, size + 4);
    const yy = curY(doc);
    doc.text(ln, MARGIN, yy + 4);
    ctxSetY(doc, yy + size + 3);
  });
  return curY(doc);
}

function note(doc, y, text, color = AMBER) {
  ctxSetY(doc, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(sanitize(text), CONTENT_W - 16);
  lines.forEach((ln) => {
    ensureSpace(doc, 12);
    const yy = curY(doc);
    doc.text(ln, MARGIN + 4, yy + 4);
    ctxSetY(doc, yy + 12);
  });
  return curY(doc);
}

// --- vector marks (WinAnsi-safe replacements for ✓ ✕ →) --------------------
function drawCheck(doc, x, baseline, color) {
  doc.setDrawColor(...color);
  doc.setLineWidth(1.3);
  doc.line(x + 1, baseline - 3, x + 3.2, baseline - 0.8);
  doc.line(x + 3.2, baseline - 0.8, x + 7.5, baseline - 6.5);
}
function drawCross(doc, x, baseline, color) {
  doc.setDrawColor(...color);
  doc.setLineWidth(1.2);
  doc.line(x + 1.5, baseline - 6.5, x + 7, baseline - 1);
  doc.line(x + 7, baseline - 6.5, x + 1.5, baseline - 1);
}
function drawArrow(doc, x, baseline, len, color) {
  const y = baseline - 3;
  doc.setDrawColor(...color);
  doc.setLineWidth(1);
  doc.line(x, y, x + len, y);
  doc.line(x + len - 3, y - 2.4, x + len, y);
  doc.line(x + len - 3, y + 2.4, x + len, y);
}

function pill(doc, text, x, y, align = "left") {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  const w = doc.getTextWidth(text) + 12;
  const px = align === "right" ? x - w : x;
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(px, y - 9, w, 13, 6, 6, "F");
  doc.setTextColor(...ACCENT_DK);
  doc.text(text, px + 6, y);
}

function drawFooters(doc) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(...HAIRLINE);
    doc.line(MARGIN, PAGE_H - 38, PAGE_W - MARGIN, PAGE_H - 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...FAINT);
    doc.text("MedBridge by Healtour Solutions · Estimates are indicative and not a medical or financial guarantee.", MARGIN, PAGE_H - 24);
    doc.text(`Page ${i} of ${n}`, PAGE_W - MARGIN, PAGE_H - 24, { align: "right" });
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers (mirror JourneyPlanCard.jsx)
// ---------------------------------------------------------------------------

function planTitle(plan) {
  const c = plan?.intake?.condition;
  const label = plan?.procedureLabel || (c ? capitalize(c) : null);
  const country = countryLabel(plan?.intake?.origin_country);
  if (!label) return "Your Journey Plan";
  return label + (country ? ` — from ${country}` : "");
}

function fmtUsd(n) { return typeof n === "number" && isFinite(n) ? `$${n.toLocaleString("en-US")}` : null; }
// "Rs " (not ₹) — jsPDF's standard Helvetica is WinAnsi and has no rupee glyph.
function fmtInr(n) { return typeof n === "number" && isFinite(n) ? `Rs ${n.toLocaleString("en-IN")}` : null; }

// jsPDF's built-in fonts are WinAnsi-only: map the few Unicode glyphs that appear
// in backend text (notes, doc names, summary) to safe equivalents so they don't
// render as garbage. Glyphs we draw ourselves (checks, arrows) are vectors, below.
const _GLYPHS = { "₹": "Rs", "→": "->", "←": "<-", "↳": ">", "✓": "", "✔": "", "✕": "", "✗": "", "✈": "", "★": "*", "☆": "*", "≈": "~", "•": "-" };
function sanitize(s) {
  return String(s ?? "").replace(/[₹→←↳✓✔✕✗✈★☆≈•]/g, (ch) => _GLYPHS[ch] ?? "");
}

function range(min, max, fmt) {
  const a = fmt(min), b = fmt(max);
  if (a && b) return a === b ? a : `${a} – ${b}`;
  return a || b || null;
}

function capitalize(s) { return typeof s === "string" && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function countryLabel(code) {
  if (!code) return null;
  if (code === "GENERIC" || code === "OTHER") return "Other";
  return COUNTRY_NAME[code] || code;
}

const _MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDay(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [, , mo, d] = m;
  return `${parseInt(d, 10)} ${_MONTHS[parseInt(mo, 10) - 1]}`;
}

function fmtDuration(min) {
  if (!Number.isFinite(min) || min <= 0) return null;
  const h = Math.floor(min / 60), m = min % 60;
  return `${h ? h + "h " : ""}${m ? m + "m" : ""}`.trim() || null;
}

function buildTimeline(cost, procedureLabel) {
  const icu = Number.isFinite(cost?.icu_days) ? cost.icu_days : 0;
  const ward = Number.isFinite(cost?.ward_days) ? cost.ward_days : 0;
  const steps = [
    { day: "Day 0", label: "Arrival & pre-op evaluation" },
    { day: "Day 1", label: procedureLabel || "Procedure" },
  ];
  let cur = 1;
  if (icu > 0) {
    const end = 1 + icu;
    steps.push({ day: end === 2 ? "Day 2" : `Day 2–${end}`, label: "ICU & close monitoring" });
    cur = end;
  }
  if (ward > 0) {
    const start = cur + 1, end = cur + ward;
    steps.push({ day: start === end ? `Day ${start}` : `Day ${start}–${end}`, label: "Ward recovery & physio" });
    cur = end;
  }
  steps.push({ day: `Day ${cur + 2}`, label: "Discharge & fit-to-fly" });
  return steps;
}

function extractSummary(summary) {
  if (!summary || typeof summary !== "string") return "";
  const trimmed = summary.trim();
  if (!trimmed) return "";
  const headingAt = trimmed.search(/\n\s*#{1,6}\s/);
  let intro = headingAt > 0 ? trimmed.slice(0, headingAt) : trimmed;
  intro = intro.replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
  if (intro.length > 700) intro = intro.slice(0, 697).trimEnd() + "…";
  return intro;
}

// ---------------------------------------------------------------------------
// misc
// ---------------------------------------------------------------------------

function pad2(n) { return String(n).padStart(2, "0"); }

function longDate(d) {
  return `${d.getDate()} ${_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Truncate a string to fit maxWidth (points) at the current font, adding an ellipsis.
function truncate(doc, str, maxWidth) {
  str = sanitize(str);
  if (doc.getTextWidth(str) <= maxWidth) return str;
  let lo = 0, hi = str.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (doc.getTextWidth(str.slice(0, mid) + "…") <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return str.slice(0, lo) + "…";
}
