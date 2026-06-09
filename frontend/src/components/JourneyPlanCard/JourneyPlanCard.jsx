/**
 * JourneyPlanCard.jsx — the structured Journey Plan, rendered as a dashboard:
 *
 *   ┌ PATIENT REQUEST ─────────────── From · Budget · Timeline ┐
 *   ├──────────────────────────┬──────────────────────────────┤
 *   │ Recommended hospitals      │ Estimated cost                 │
 *   ├──────────────────────────┼──────────────────────────────┤
 *   │ Travel checklist           │ Timeline                       │
 *   ├──────────────────────────┴──────────────────────────────┤
 *   │ 💡 AI recommendation summary                              │
 *   └────────────────────────────────────────────────────────┘
 *
 * Data rules (from the team brief):
 *  - Read everything BY KEY NAME, never by array index.
 *  - Never render NaN/undefined; each panel self-guards and degrades to a note.
 *  - While loading, a panel with no data yet shows a pulse skeleton.
 *
 * Some panel details are NOT returned by the backend and are DERIVED client-side
 * for presentation (clearly approximate, never invented facts):
 *  - hospital "match %"  → from rank + within_budget + international_desk
 *  - recovery "Timeline" → from estimate_cost's ward_days / icu_days
 *  - "savings"           → shown only if a home-country quote is known (else hidden)
 *
 * Props (tool responses already unwrapped, or null until they arrive):
 *   intake   - { condition, origin_country, budget_usd, timeline_weeks }
 *   hospital - find_hospitals response
 *   cost     - estimate_cost response
 *   docs     - get_document_checklist response
 *   booking  - request_appointment response (optional)
 *   summary  - the agent's streamed narrative (its opening line becomes the AI summary)
 *   isLoading
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { COUNTRIES } from "../../constants/countries";
import { MEDBRIDGE_TRANSLATOR_LANGUAGES, languageName } from "../../constants/languages";
import { useChatContext } from "../../context/ChatContext";
import { useWishlist, wishlistKey } from "../../context/WishlistContext";
import { useToast } from "../../context/ToastContext";
import { fetchHospitalEstimate, getCachedHospitalEstimate } from "../../services/api";

const COUNTRY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));
const EASE = [0.16, 1, 0.3, 1];

export default function JourneyPlanCard({
  intake,
  hospital,
  cost,
  docs,
  booking,
  flights,
  flightParams,
  summary,
  isLoading,
}) {
  const list = (Array.isArray(hospital?.hospitals) ? hospital.hospitals : []).slice(0, 3);
  // The costed hospital is the recommended one; otherwise the top-ranked match.
  const recommendedId = cost?.hospital_id || list[0]?.hospital_id || null;
  const procedure = hospital?.matched_procedure || cost?.procedure || null;
  const procedureLabel = labelize(procedure);

  // Per-hospital plan + cost, fetched on demand. The recommended hospital is
  // seeded from props; the others are re-costed via /estimate_hospital in two
  // phases: treatment cost (instant) then live flights (~10s).
  // cache: { [id]: { cost, flights, status: "loading"|"partial"|"ready"|"error" } }
  const [selectedId, setSelectedId] = useState(recommendedId);
  // Seed from props (recommended) + the session estimate cache (others), so a
  // remount after navigation/refresh shows cached plans instantly with no refetch.
  const [cache, setCache] = useState(() =>
    buildInitialCache({ list, recommendedId, procedure, intake, propCost: cost, propFlights: flights, flightParams }));
  const costReqRef = useRef(new Set());     // ids whose treatment cost was requested
  const flightReqRef = useRef(new Set());   // ids whose live flights were requested

  const { sendMessage, isStreaming } = useChatContext();
  const wishlist = useWishlist();
  const { toast } = useToast();
  const reduce = useReducedMotion();

  // Which panel is currently active (hovered / focused / tapped). null = none.
  // The active panel rises and reveals extra detail; the others recede.
  const [active, setActive] = useState(null);
  const coord = (key) => ({
    active: active === key,
    dimmed: active !== null && active !== key,
    onActivate: () => setActive(key),
    onToggle: () => setActive((k) => (k === key ? null : key)),
    onDeactivate: () => setActive((k) => (k === key ? null : k)),
    reduce,
  });

  // Flight context (origin airport + departure date) is derived from the
  // recommended hospital's search; it only exists once that search has returned.
  const flightCtx = deriveFlightContext(flights, flightParams);
  const canSearchFlights = !!(flightCtx.origin_airport && flightCtx.departure_date);

  // Seed the cache with the recommended hospital's props as they arrive.
  useEffect(() => {
    if (recommendedId && cost) {
      costReqRef.current.add(recommendedId);
      flightReqRef.current.add(recommendedId);
      setCache((prev) =>
        prev[recommendedId]?.cost === cost && prev[recommendedId]?.flights === flights
          ? prev
          : { ...prev, [recommendedId]: { cost, flights, status: "ready" } }
      );
    }
  }, [recommendedId, cost, flights]);

  // Default the selection to the recommended hospital once it's known.
  useEffect(() => {
    setSelectedId((prev) => prev || recommendedId);
  }, [recommendedId]);

  // NOTE: deliberately do NOT abort in-flight fetches on unmount. Under React
  // StrictMode (dev) the simulated unmount would abort the request while the
  // dedupe ref still marks it "requested", so the remount never refetches and
  // the panel spins forever. A stale setState on a truly-unmounted component is
  // a harmless no-op in React 18; the 30s per-request timeout guards real hangs.

  // Phase 1 — treatment cost + timeline, instant (needs no flight context).
  const fetchCost = useCallback((id) => {
    if (!id || !procedure || costReqRef.current.has(id)) return;
    costReqRef.current.add(id);
    setCache((prev) => (prev[id]?.cost ? prev : { ...prev, [id]: { status: "loading" } }));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    fetchHospitalEstimate(
      { hospital_id: id, procedure, origin_country: intake?.origin_country || "", skip_flights: true },
      ctrl.signal,
    )
      .then(({ cost: c }) =>
        setCache((prev) => {
          const cur = prev[id] || {};
          if (cur.status === "ready") return prev;            // flights already finalized
          return { ...prev, [id]: { ...cur, cost: c, status: "partial" } };
        }),
      )
      .catch((err) => {
        console.error("[MedBridge] cost fetch failed:", err);
        costReqRef.current.delete(id);                        // allow a retry
        setCache((prev) => (prev[id]?.cost ? prev : { ...prev, [id]: { status: "error" } }));
      })
      .finally(() => clearTimeout(timer));
  }, [procedure, intake]);

  // Phase 2 — live flights folded into the total. Needs flight context, so it
  // is gated on `canSearchFlights` and re-fires once that context arrives.
  const fetchFlights = useCallback((id) => {
    if (!id || !procedure || flightReqRef.current.has(id)) return;
    const ctx = deriveFlightContext(flights, flightParams);
    if (!ctx.origin_airport || !ctx.departure_date) return;   // no context yet -> wait
    flightReqRef.current.add(id);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    fetchHospitalEstimate(
      { hospital_id: id, procedure, origin_country: intake?.origin_country || "", ...ctx },
      ctrl.signal,
    )
      .then(({ cost: c, flights: f }) =>
        setCache((prev) => ({ ...prev, [id]: { cost: c, flights: f, status: "ready" } })),
      )
      .catch((err) => {
        console.error("[MedBridge] flights fetch failed:", err);
        flightReqRef.current.delete(id);                      // allow a retry
        setCache((prev) => {                                  // keep treatment cost, finalize without flights
          const cur = prev[id];
          return cur?.cost ? { ...prev, [id]: { ...cur, status: "ready" } } : prev;
        });
      })
      .finally(() => clearTimeout(timer));
  }, [procedure, intake, flights, flightParams]);

  const onSelect = useCallback((id) => {
    if (!id) return;
    setSelectedId(id);
    fetchCost(id);
    fetchFlights(id);
  }, [fetchCost, fetchFlights]);

  const others = useMemo(
    () => list.filter((h) => h?.hospital_id && h.hospital_id !== recommendedId).map((h) => h.hospital_id),
    [list, recommendedId],
  );

  // Prefetch treatment cost for the other hospitals immediately.
  useEffect(() => {
    if (!procedure) return;
    others.forEach((id) => fetchCost(id));
  }, [procedure, others, fetchCost]);

  // Prefetch flights once the flight context is available (re-runs when it arrives).
  useEffect(() => {
    if (!procedure || !canSearchFlights) return;
    others.forEach((id) => fetchFlights(id));
  }, [procedure, canSearchFlights, others, fetchFlights]);

  // If the plan has no live flights at all (agent never searched) and streaming
  // has finished, finalize the cost-only hospitals so they stop "searching".
  useEffect(() => {
    if (isLoading || canSearchFlights) return;
    setCache((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (next[k]?.status === "partial" && next[k]?.cost) {
          next[k] = { ...next[k], status: "ready" };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [isLoading, canSearchFlights, cache]);

  const onBook = useCallback((h) => {
    if (!h || isStreaming) return;
    sendMessage(`Please book my appointment and prepare the booking for ${h.name} in ${h.city}.`);
  }, [sendMessage, isStreaming]);

  // What the cost/timeline/flight panels render: the SELECTED hospital's data.
  const sel = selectedId ? cache[selectedId] : null;
  const selStatus = sel?.status;                          // loading | partial | ready | error
  const isRecommendedSelected = selectedId === recommendedId;
  // Cost (treatment, then treatment+flights) shows as soon as phase 1 lands.
  const selCost = sel?.cost || (isRecommendedSelected ? cost : null);
  const selFlights = selStatus === "ready" ? sel?.flights : (isRecommendedSelected ? flights : null);
  const selectedFlight = pickFlight(selFlights, selCost);

  const selCity = list.find((h) => h?.hospital_id === selectedId)?.city || "";
  const selError = selStatus === "error";
  const costFetching = selStatus === "loading" && !selCost;   // phase 1 (brief)
  const flightsPending = selStatus === "loading" || selStatus === "partial"; // phases 1-2
  const initialSkeleton = isLoading && !selCost && !selStatus; // before any tool data

  // `data` for the swap panels: real data, or a sentinel while a phase is in
  // flight / on error so the panel renders progress or a retry note (not null).
  const costPanelData = selCost || (costFetching ? "loading" : selError ? "error" : null);
  const flightPanelData = selectedFlight || (flightsPending ? "loading" : selError ? "error" : null);

  // Export the CURRENTLY SELECTED hospital's plan (what the user is viewing) to PDF.
  const selectedHospital =
    list.find((h) => h?.hospital_id === selectedId) ||
    (selCost?.hospital_name ? { name: selCost.hospital_name, city: selCost.hospital_city } : null);
  const canDownload = !initialSkeleton && (list.length > 0 || !!selCost);

  const [pdfBusy, setPdfBusy] = useState(false);
  const handleDownloadPdf = useCallback(async () => {
    setPdfBusy(true);
    try {
      // Lazy-load jspdf only on demand so it (and its heavy transitive deps) stays
      // out of the initial bundle.
      const { downloadJourneyPlanPdf } = await import("../../services/pdf/journeyPlanPdf");
      downloadJourneyPlanPdf({
        intake,
        procedureLabel,
        selectedHospital,
        isRecommended: selectedId === recommendedId,
        hospitalStatus: hospital?.status,
        supportLang: hospital?.requested_interpreter_language || intake?.support_language,
        cost: selCost,
        flight: selectedFlight,
        flights: selFlights,
        docs,
        booking,
        summary,
        cache,
        hospitalsList: list,
        recommendedId,
      });
    } catch (err) {
      console.error("[MedBridge] PDF export failed:", err);
    } finally {
      setPdfBusy(false);
    }
  }, [intake, procedureLabel, selectedHospital, selectedId, recommendedId, hospital,
      selCost, selectedFlight, selFlights, docs, booking, summary, cache, list]);

  // --- Wishlist: save the SELECTED hospital's plan so it can be re-viewed,
  // chatted about, or booked later from /wishlist. -----------------------------
  const wlKey = wishlistKey(intake?.condition, selectedId || recommendedId);
  const isSaved = wishlist.has(wlKey);

  const handleToggleWishlist = useCallback(() => {
    const hName = selectedHospital?.name || selCost?.hospital_name || "the recommended hospital";
    const hCity = selectedHospital?.city || selCost?.hospital_city || "";
    const result = wishlist.toggle({
      key: wlKey,
      // Snapshot of the EXACT card props so /wishlist re-renders it faithfully.
      // cost/flights are the SELECTED hospital's, so the saved view leads with it.
      props: {
        intake,
        hospital,
        cost: selCost,
        docs,
        booking,
        flights: selFlights,
        flightParams,
        summary,
      },
      // Small derived fields for the list row + chat/booking seed messages.
      preview: {
        title: (procedureLabel || capitalize(intake?.condition) || "Journey plan"),
        procedureLabel: procedureLabel || capitalize(intake?.condition) || null,
        condition: intake?.condition || null,
        hospitalName: hName,
        hospitalCity: hCity,
        country: countryLabel(intake?.origin_country),
        totalUsd: range(selCost?.total_usd_min, selCost?.total_usd_max, fmtUsd),
        budget: Number.isFinite(intake?.budget_usd) ? intake.budget_usd : null,
        timelineWeeks: Number.isFinite(intake?.timeline_weeks) ? intake.timeline_weeks : null,
      },
    });
    toast({
      title: result === "saved" ? "Saved to your wishlist" : "Removed from wishlist",
      variant: result === "saved" ? "success" : "default",
    });
  }, [wishlist, wlKey, selectedHospital, selCost, intake, hospital, docs, booking,
      selFlights, flightParams, summary, procedureLabel, toast]);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="bg-[var(--color-surface)] rounded-2xl shadow-card-hover border border-[var(--color-border)] overflow-hidden"
    >
      <PatientHeader intake={intake} isLoading={isLoading} />

      <div className="bg-[var(--color-bg)] p-4 sm:p-5 space-y-4">
        {booking && <BookingBanner booking={booking} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <Panel {...coord("hospitals")} icon={<IconHospital />} title="Recommended hospitals" data={hospital} isLoading={isLoading}
            render={(expanded) => (
              <HospitalsBody
                list={list}
                status={hospital?.status}
                selectedId={selectedId}
                recommendedId={recommendedId}
                cache={cache}
                onSelect={onSelect}
                onBook={onBook}
                isStreaming={isStreaming}
                expanded={expanded}
                reduce={reduce}
                supportLang={hospital?.requested_interpreter_language || intake?.support_language}
              />
            )} />

          <Panel {...coord("cost")} icon={<IconCost />} title="Estimated cost" data={costPanelData} isLoading={initialSkeleton}
            render={(expanded) => selError
              ? <RetryNote onRetry={() => onSelect(selectedId)} />
              : costFetching
                ? <ProgressSteps steps={["Fetching treatment costs", "Building your plan"]} />
                : <SwapIn k={selectedId}><CostBody cost={selCost} flightsPending={flightsPending} procedureLabel={procedureLabel} expanded={expanded} reduce={reduce} /></SwapIn>} />

          <Panel {...coord("flights")} icon={<IconPlane />} title="Flights" data={flightPanelData} isLoading={initialSkeleton}
            render={(expanded) => selError
              ? <RetryNote onRetry={() => onSelect(selectedId)} />
              : flightsPending
                ? <ProgressSteps steps={[`Searching live flights${selCity ? ` to ${selCity}` : ""}`, "Comparing fares", "Pricing your journey"]} />
                : <SwapIn k={selectedId}><FlightsBody flight={selectedFlight} cost={selCost} expanded={expanded} reduce={reduce} /></SwapIn>} />

          <Panel {...coord("checklist")} icon={<IconChecklist />} title="Travel checklist" data={docs} isLoading={isLoading}
            render={(expanded) => <ChecklistBody docs={docs} expanded={expanded} reduce={reduce} />} />

          <Panel {...coord("timeline")} icon={<IconTimeline />} title="Timeline" data={costPanelData} isLoading={initialSkeleton} className="lg:col-span-2"
            render={(expanded) => costFetching
              ? <ProgressSteps steps={["Preparing recovery timeline"]} />
              : <SwapIn k={selectedId}><TimelineBody cost={selCost} procedureLabel={procedureLabel} expanded={expanded} reduce={reduce} /></SwapIn>} />
        </div>

        <CompareStrip list={list} cache={cache} selectedId={selectedId} recommendedId={recommendedId} onSelect={onSelect} />

        <SwapIn k={selectedId}>
          <FinalEstimate cost={selCost} intake={intake} isLoading={initialSkeleton} flightsPending={flightsPending} />
        </SwapIn>

        <AISummary summary={summary} isLoading={isLoading} />

        {canDownload && (
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleToggleWishlist(); }}
              title={isSaved ? "Remove from wishlist" : "Save this plan to your wishlist"}
              aria-pressed={isSaved}
              className={`inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-lg px-3 py-1.5 border transition-colors ${
                isSaved
                  ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-subtle)]"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              }`}
            >
              <IconHeart className="w-3.5 h-3.5" filled={isSaved} />
              {isSaved ? "Saved" : "Wishlist"}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDownloadPdf(); }}
              disabled={pdfBusy}
              title="Download this Journey Plan as a PDF"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-lg px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfBusy
                ? <><Spinner className="w-3.5 h-3.5" /> Preparing…</>
                : <><IconDownload className="w-3.5 h-3.5" /> Download PDF</>}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Cross-fade + slide a panel body when the selected hospital changes.
function SwapIn({ k, children }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={k}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Pick the flight to feature: the one estimate_cost costed in (by result_index),
// else the cheapest (the backend returns results sorted cheapest-first).
function pickFlight(flights, cost) {
  const list = Array.isArray(flights?.results) ? flights.results : [];
  if (!list.length) return null;
  const id = cost?.selected_flight?.result_index;
  if (id) {
    const match = list.find((f) => f?.result_index === id);
    if (match) return match;
  }
  return list[0];
}

// Initial per-hospital cache for a fresh mount: the recommended hospital from
// props, plus any OTHER hospital whose estimate is already in the session cache
// (from a previous view this session). This is what stops a nav-away/refresh from
// re-fetching everything — cached hospitals start "ready", never re-spinner.
function buildInitialCache({ list, recommendedId, procedure, intake, propCost, propFlights, flightParams }) {
  const init = {};
  if (recommendedId && propCost) {
    init[recommendedId] = { cost: propCost, flights: propFlights, status: "ready" };
  }
  if (!procedure || !Array.isArray(list)) return init;
  const ctx = deriveFlightContext(propFlights, flightParams);
  const canFlights = !!(ctx.origin_airport && ctx.departure_date);
  const origin = intake?.origin_country || "";
  for (const h of list) {
    const id = h?.hospital_id;
    if (!id || init[id]) continue;
    // Prefer the flights-included estimate; fall back to the treatment-only one.
    const withFlights = canFlights
      ? getCachedHospitalEstimate({ hospital_id: id, procedure, origin_country: origin, ...ctx })
      : null;
    if (withFlights) {
      init[id] = { cost: withFlights.cost, flights: withFlights.flights, status: "ready" };
      continue;
    }
    const treatmentOnly = getCachedHospitalEstimate({ hospital_id: id, procedure, origin_country: origin, skip_flights: true });
    if (treatmentOnly) init[id] = { cost: treatmentOnly.cost, status: "partial" };
  }
  return init;
}

// Travel context for re-costing another hospital: reuse the recommended search's
// origin airport + departure date, plus the captured party size / cabin / return.
function deriveFlightContext(flights, flightParams) {
  const r0 = Array.isArray(flights?.results) ? flights.results[0] : null;
  return {
    origin_airport: r0?.from || flightParams?.origin || "",
    departure_date: ymd(r0?.departure) || flightParams?.departure_date || "",
    return_date:    flightParams?.return_date || "",
    adults:         flightParams?.adults ?? 1,
    children:       flightParams?.children ?? 0,
    infants:        flightParams?.infants ?? 0,
    cabin_class:    flightParams?.cabin_class ?? 2,
  };
}

// "2026-06-25T05:55:00" -> "2026-06-25"
function ymd(s) {
  if (!s || typeof s !== "string") return "";
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

// --- Patient request header ------------------------------------------------

function PatientHeader({ intake, isLoading }) {
  const condition = intake?.condition;
  const country = countryLabel(intake?.origin_country);

  const title = condition
    ? capitalize(condition) + (country ? ` from ${country}` : "")
    : "Your Journey Plan";

  return (
    <div className="relative px-5 py-4 flex flex-wrap items-center justify-between gap-3 overflow-hidden">
      {/* soft accent wash behind the header */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(110deg, var(--color-accent-subtle), transparent 60%)" }}
      />
      <div className="relative flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_var(--color-accent-muted)]">
          <IconClipboard className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-text-tertiary)]">
              Patient request
            </span>
            {isLoading && (
              <span className="flex items-center gap-1 text-[11px] text-[var(--color-accent)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                building…
              </span>
            )}
          </div>
          <p className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] truncate">{title}</p>
        </div>
      </div>

      <div className="relative flex items-center gap-4 text-xs text-[var(--color-text-secondary)] flex-shrink-0">
        {country && <Meta label="From">{country}</Meta>}
        {Number.isFinite(intake?.budget_usd) && (
          <Meta label="Budget">${intake.budget_usd.toLocaleString("en-US")}</Meta>
        )}
        {Number.isFinite(intake?.timeline_weeks) && (
          <Meta label="Timeline">{intake.timeline_weeks} weeks</Meta>
        )}
      </div>
    </div>
  );
}

function Meta({ label, children }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--color-text-primary)] whitespace-nowrap">{children}</p>
    </div>
  );
}

// --- Panel shell -----------------------------------------------------------

function Panel({
  icon, title, data, isLoading, render, className = "",
  active, dimmed, onActivate, onDeactivate, onToggle, reduce,
}) {
  let body;
  let hasData = false;
  if (data) {
    hasData = true;
    try {
      body = render(active);
    } catch (err) {
      console.error(`[MedBridge] Failed to render "${title}":`, err);
      body = <p className="text-sm text-[var(--color-text-secondary)]">See the summary below for these details.</p>;
    }
  } else if (isLoading) {
    body = <PanelSkeleton />;
  } else {
    return null; // nothing to show and not loading -> hide the panel entirely
  }

  return (
    <motion.section
      tabIndex={hasData ? 0 : -1}
      onMouseEnter={hasData ? onActivate : undefined}
      onMouseLeave={hasData ? onDeactivate : undefined}
      onFocus={hasData ? onActivate : undefined}
      onBlur={hasData ? (e) => { if (!e.currentTarget.contains(e.relatedTarget)) onDeactivate(); } : undefined}
      onClick={hasData ? onToggle : undefined}
      animate={reduce
        ? { opacity: dimmed ? 0.7 : 1 }
        : { scale: active ? 1.012 : dimmed ? 0.985 : 1, opacity: dimmed ? 0.62 : 1, y: active ? -2 : 0 }}
      transition={{ duration: 0.28, ease: EASE }}
      style={{ willChange: "transform" }}
      className={`group relative rounded-xl border p-4 outline-none cursor-default
        bg-[var(--color-surface)] transition-[box-shadow,border-color] duration-300
        ${active
          ? "border-[var(--color-accent)] shadow-card-hover z-10"
          : "border-[var(--color-border)] shadow-surface hover:border-[var(--color-accent)]/40"}
        ${className}`}
    >
      {/* accent top-bar that wipes in on activate */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-4 right-4 top-0 h-[2px] rounded-full origin-left transition-transform duration-300"
        style={{
          background: "linear-gradient(90deg, var(--color-accent), transparent)",
          transform: active ? "scaleX(1)" : "scaleX(0)",
        }}
      />
      <header className="flex items-center gap-2 mb-3">
        <span className={`grid place-items-center w-7 h-7 rounded-lg transition-colors duration-300
          ${active ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"}`}>
          {icon}
        </span>
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-text-tertiary)]">{title}</h3>
        <IconChevron className={`ml-auto w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-300
          ${active ? "rotate-180 text-[var(--color-accent)]" : "opacity-0 group-hover:opacity-100"}`} />
      </header>
      {body}
    </motion.section>
  );
}

// Smoothly reveals hidden content on activate; instant under reduced-motion.
function Reveal({ show, reduce, children }) {
  if (reduce) return show ? <div>{children}</div> : null;
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="reveal"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Small "there's more — hover to see it" affordance, hidden once expanded.
function MoreHint({ show, children }) {
  if (!show) return null;
  return (
    <p className="pt-2 mt-1 flex items-center gap-1 text-[11px] font-medium text-[var(--color-accent)] opacity-80 group-hover:opacity-100 transition-opacity">
      <IconChevron className="w-3 h-3" />
      {children}
    </p>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-2.5 animate-pulse">
      <div className="h-4 bg-[var(--color-surface-2)] rounded w-1/2" />
      <div className="h-3 bg-[var(--color-surface-2)] rounded w-full" />
      <div className="h-3 bg-[var(--color-surface-2)] rounded w-5/6" />
      <div className="h-3 bg-[var(--color-surface-2)] rounded w-2/3" />
    </div>
  );
}

// --- Recommended hospitals -------------------------------------------------

function HospitalsBody({ list, status, selectedId, recommendedId, cache, onSelect, onBook, isStreaming, supportLang, expanded, reduce }) {
  const isGeneral = status === "general_recommendation";

  if (!list.length) {
    const name = cache?.[recommendedId]?.cost?.hospital_name;
    if (!name) return <p className="text-sm text-[var(--color-text-secondary)]">Matching you to the best hospital…</p>;
    return <p className="text-sm font-semibold text-[var(--color-text-primary)]">{name}</p>;
  }

  // Show the top 2 always; reveal the rest on hover.
  const COLLAPSED = 2;
  const head = list.slice(0, COLLAPSED);
  const tail = list.slice(COLLAPSED);

  const Row = (h, i) => {
    const { pct, label } = matchInfo(h, i, status);
    const isRec = h?.hospital_id === recommendedId;
    const isSel = h?.hospital_id === selectedId;
    const entry = cache?.[h?.hospital_id];
    const hasCost = entry?.cost && entry.cost.status !== "unavailable";
    const total = hasCost
      ? range(entry.cost.total_usd_min, entry.cost.total_usd_max, fmtUsd)
      : range(h?.est_usd_min, h?.est_usd_max, fmtUsd);
    const totalLabel = (entry?.status === "ready") ? "Total " : hasCost ? "Treatment " : "From ";
    return (
      <button
        type="button"
        key={h?.hospital_id || i}
        onClick={(e) => { e.stopPropagation(); onSelect(h?.hospital_id); }}
        aria-pressed={isSel}
        className={`w-full text-left flex items-start justify-between gap-3 rounded-lg p-2.5 transition-colors ${
          isSel ? "bg-[var(--color-accent-subtle)] ring-2 ring-[var(--color-accent)]" : "hover:bg-[var(--color-surface-2)] ring-1 ring-transparent"
        }`}
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 flex-wrap">
            <span className={expanded ? "" : "truncate"}>{h?.name || "Hospital"}</span>
            {isRec && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-accent)] bg-[var(--color-accent-subtle)] rounded px-1 py-0.5">
                Recommended
              </span>
            )}
            {h?.international_desk && (
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">• intl desk</span>
            )}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {[h?.city, h?.tier ? `Tier ${h.tier}` : null].filter(Boolean).join(" · ")}
          </p>
          {supportLang && <InterpreterLine has={hasTranslator(h, supportLang)} lang={supportLang} />}
          {total && (
            <p className="text-[11px] mt-0.5 text-[var(--color-text-secondary)] tabular-nums">
              {totalLabel}
              <span className="font-semibold text-[var(--color-text-primary)]">{total}</span>
              {!hasCost && entry?.status !== "loading" && <span className="text-[var(--color-text-tertiary)]"> est.</span>}
              {entry?.status === "partial" && <span className="text-[var(--color-accent)]"> +flights…</span>}
            </p>
          )}
          {isSel && onBook && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onBook(h); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onBook(h); } }}
              aria-disabled={isStreaming}
              className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold rounded-md px-2.5 py-1 transition-colors ${
                isStreaming
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)] cursor-not-allowed"
                  : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] cursor-pointer"
              }`}
            >
              <IconCheck className="w-3 h-3" /> Book this hospital
            </span>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {entry?.status === "loading" || entry?.status === "partial" ? (
            <Spinner className="w-4 h-4 ml-auto" />
          ) : entry?.status === "error" ? (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">tap to retry</p>
          ) : pct != null ? (
            <p className={`text-sm font-extrabold tabular-nums ${isSel ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}>{pct}%</p>
          ) : (
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Accredited</p>
          )}
          {entry?.status !== "loading" && entry?.status !== "partial" && (
            <p className="text-[10px] text-[var(--color-text-tertiary)]">{label}</p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-[var(--color-text-tertiary)] -mt-1 mb-1">Tap a hospital to see its plan &amp; cost.</p>
      {head.map(Row)}

      <Reveal show={expanded && tail.length > 0} reduce={reduce}>
        <div className="space-y-1.5">{tail.map((h, i) => Row(h, i + COLLAPSED))}</div>
      </Reveal>

      <MoreHint show={!expanded && tail.length > 0}>
        {tail.length} more hospital{tail.length > 1 ? "s" : ""} — hover to compare
      </MoreHint>

      {supportLang && (
        <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center gap-1.5 text-xs">
          {MEDBRIDGE_TRANSLATOR_LANGUAGES.includes(supportLang)
            ? <IconCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            : <IconX className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] flex-shrink-0" />}
          <span className={MEDBRIDGE_TRANSLATOR_LANGUAGES.includes(supportLang) ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-tertiary)]"}>
            MedBridge interpreter ({languageName(supportLang)}) —{" "}
            {MEDBRIDGE_TRANSLATOR_LANGUAGES.includes(supportLang) ? "available" : "not available"}
          </span>
        </div>
      )}

      {isGeneral && (
        <Note tone="amber">
          Closest accredited options — we couldn't match your exact procedure. Your coordinator
          will confirm suitability.
        </Note>
      )}
    </div>
  );
}

// Per-hospital interpreter availability line.
function InterpreterLine({ has, lang }) {
  const name = languageName(lang);
  return (
    <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${has ? "text-green-600" : "text-[var(--color-text-tertiary)]"}`}>
      {has ? <IconCheck className="w-3 h-3 flex-shrink-0" /> : <IconX className="w-3 h-3 flex-shrink-0" />}
      {has ? `${name} interpreter` : `No ${name} interpreter`}
    </p>
  );
}

function hasTranslator(h, code) {
  return Array.isArray(h?.translator_languages) && h.translator_languages.includes(code);
}

// Animated multi-step progress — cycles through the given stages with a spinner,
// progress pips and animated dots so a ~10s wait feels alive, not frozen.
function ProgressSteps({ steps }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (steps.length < 2) return;
    const t = setInterval(() => setI((v) => Math.min(v + 1, steps.length - 1)), 2200);
    return () => clearInterval(t);
  }, [steps.length]);

  return (
    <div className="space-y-2.5 py-1">
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
        <Spinner className="w-4 h-4" />
        <AnimatePresence mode="wait">
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {steps[i]}
            <AnimatedDots />
          </motion.span>
        </AnimatePresence>
      </div>
      {steps.length > 1 && (
        <div className="flex gap-1">
          {steps.map((_, k) => (
            <span
              key={k}
              className={`h-1 rounded-full transition-all duration-300 ${k <= i ? "bg-[var(--color-accent)] w-7" : "bg-[var(--color-surface-2)] w-3"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RetryNote({ onRetry }) {
  return (
    <div className="text-sm text-[var(--color-text-secondary)] space-y-1.5">
      <p className="flex items-center gap-1.5 text-amber-600">
        <IconX className="w-4 h-4 flex-shrink-0" /> Couldn't load this hospital's estimate.
      </p>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRetry(); }}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
      >
        <IconArrow className="w-3.5 h-3.5" /> Try again
      </button>
    </div>
  );
}

function AnimatedDots() {
  return (
    <span className="inline-flex">
      <span className="animate-[pulse_1s_ease-in-out_infinite]">.</span>
      <span className="animate-[pulse_1s_ease-in-out_0.2s_infinite]">.</span>
      <span className="animate-[pulse_1s_ease-in-out_0.4s_infinite]">.</span>
    </span>
  );
}

function Spinner({ className = "w-4 h-4" }) {
  return (
    <svg className={`${className} animate-spin text-[var(--color-accent)]`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// --- Compare all three (totals side by side) -------------------------------

function CompareStrip({ list, cache, selectedId, recommendedId, onSelect }) {
  if (!Array.isArray(list) || list.length < 2) return null;

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
      <div className="flex items-center gap-1.5 mb-3 text-[var(--color-text-tertiary)]">
        <IconCost />
        <h3 className="text-[11px] font-bold tracking-wider uppercase">Compare options</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {list.map((h, i) => {
          const id = h?.hospital_id;
          const entry = cache?.[id];
          const isSel = id === selectedId;
          const ready = entry?.status === "ready";
          const hasCost = entry?.cost && entry.cost.status !== "unavailable";
          const total = hasCost
            ? range(entry.cost.total_usd_min, entry.cost.total_usd_max, fmtUsd)
            : range(h?.est_usd_min, h?.est_usd_max, fmtUsd);
          const unavailable = entry?.cost?.status === "unavailable";
          return (
            <button
              type="button"
              key={id || i}
              onClick={() => onSelect(id)}
              aria-pressed={isSel}
              className={`text-left rounded-lg p-3 transition-colors ${
                isSel ? "bg-[var(--color-accent-subtle)] ring-2 ring-[var(--color-accent)]" : "bg-[var(--color-surface-2)] ring-1 ring-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              <p className="text-xs font-bold text-[var(--color-text-primary)] truncate flex items-center gap-1">
                {h?.name || "Hospital"}
                {id === recommendedId && <span className="text-[8px] font-bold uppercase text-[var(--color-accent)]">★</span>}
              </p>
              <p className="text-[10px] text-[var(--color-text-tertiary)] truncate mb-1.5">{h?.city}</p>
              {entry?.status === "loading" ? (
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]"><Spinner className="w-3.5 h-3.5" /> pricing…</div>
              ) : unavailable ? (
                <p className="text-[11px] text-amber-600">No listed price</p>
              ) : total ? (
                <p className="text-sm font-extrabold text-[var(--color-text-primary)] tabular-nums leading-tight">
                  {total}
                  {!hasCost && <span className="text-[10px] font-normal text-[var(--color-text-tertiary)]"> est.</span>}
                  {entry?.status === "partial" && <span className="block text-[9px] font-normal text-[var(--color-accent)]">+ flights…</span>}
                  {ready && entry.cost?.includes_flights && <span className="block text-[9px] font-normal text-[var(--color-text-tertiary)]">incl. flights</span>}
                </p>
              ) : (
                <p className="text-[11px] text-[var(--color-text-tertiary)]">Accredited</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Estimated cost --------------------------------------------------------

function CostBody({ cost, procedureLabel, flightsPending, expanded, reduce }) {
  if (cost?.status === "unavailable") {
    return (
      <Note tone="amber">
        {cost.message || "No listed price yet — your coordinator will get a quote for you."}
      </Note>
    );
  }

  const items = Array.isArray(cost?.line_items) ? cost.line_items : [];
  const usd = range(cost?.total_usd_min, cost?.total_usd_max, fmtUsd);
  const inr = range(cost?.total_inr_min, cost?.total_inr_max, fmtInr);

  if (!usd && !items.length) {
    return <p className="text-sm text-[var(--color-text-secondary)]">Cost details are in the summary below.</p>;
  }

  const COLLAPSED = 3;
  const head = items.slice(0, COLLAPSED);
  const tail = items.slice(COLLAPSED);

  const LineItem = (item, i) => (
    <li key={`${item?.label ?? "item"}-${i}`} className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-[var(--color-text-secondary)]">{item?.label || "Line item"}</span>
      <span className="text-[var(--color-text-primary)] font-medium tabular-nums">{fmtUsd(item?.usd) || "—"}</span>
    </li>
  );

  return (
    <div className="space-y-3">
      {procedureLabel && (
        <p className="text-xs text-[var(--color-text-secondary)] -mt-1">{procedureLabel}</p>
      )}

      {usd && (
        <div>
          <p className="text-2xl font-extrabold text-[var(--color-text-primary)] tabular-nums leading-tight">{usd}</p>
          {inr && <p className="text-xs text-[var(--color-text-tertiary)] tabular-nums">{inr}</p>}
        </div>
      )}

      {head.length > 0 && (
        <ul className="divide-y divide-[var(--color-border-subtle)] border-t border-[var(--color-border-subtle)]">
          {head.map(LineItem)}
        </ul>
      )}

      <Reveal show={expanded} reduce={reduce}>
        <div className="space-y-3">
          {tail.length > 0 && (
            <ul className="divide-y divide-[var(--color-border-subtle)]">{tail.map((it, i) => LineItem(it, i + COLLAPSED))}</ul>
          )}
          {cost?.scope_note && <p className="text-[11px] text-[var(--color-text-tertiary)]">{cost.scope_note}</p>}
          {cost?.currency_note && <p className="text-[11px] text-[var(--color-text-tertiary)] italic">{cost.currency_note}</p>}
        </div>
      </Reveal>

      {flightsPending && (
        <p className="text-[11px] text-[var(--color-accent)] flex items-center gap-1.5">
          <Spinner className="w-3 h-3" /> Adding live flights to the total<AnimatedDots />
        </p>
      )}

      <MoreHint show={!expanded && (tail.length > 0 || cost?.scope_note || cost?.currency_note)}>
        {tail.length > 0 ? `${tail.length} more line item${tail.length > 1 ? "s" : ""} — hover for the full breakdown` : "hover for details"}
      </MoreHint>
    </div>
  );
}

// --- Travel checklist ------------------------------------------------------

function ChecklistBody({ docs, expanded, reduce }) {
  const mandatory = Array.isArray(docs?.mandatory_docs) ? docs.mandatory_docs : [];
  const recommended = Array.isArray(docs?.recommended_docs) ? docs.recommended_docs : [];
  const isFallback = docs?.status === "fallback";

  // Lead with the visa, then mandatory, then recommended — all as green checks.
  const visaItem = docs?.visa_type
    ? `${docs.visa_type}${docs?.visa_required === false ? " (visa-free)" : ""}`
    : null;
  const items = [visaItem, ...mandatory, ...recommended].filter(Boolean);

  if (!items.length) {
    return (
      <p className="text-sm text-[var(--color-text-secondary)]">
        Your coordinator will confirm the exact documents for your country.
      </p>
    );
  }

  const COLLAPSED = 4;
  const head = items.slice(0, COLLAPSED);
  const tail = items.slice(COLLAPSED);

  const DocItem = (doc, i) => (
    <div key={`${doc}-${i}`} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
      <IconCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
      <span>{typeof doc === "string" ? doc : String(doc)}</span>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
        {head.map(DocItem)}
      </div>

      <Reveal show={expanded} reduce={reduce}>
        <div className="space-y-3">
          {tail.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">{tail.map((d, i) => DocItem(d, i + COLLAPSED))}</div>
          )}
          {(Number.isFinite(docs?.processing_days) || typeof docs?.processing_days === "string") && (
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              Visa processing ≈ {docs.processing_days}{Number.isFinite(docs?.processing_days) ? " days" : ""}
              {Number.isFinite(docs?.visa_duration_days) ? ` · valid ${docs.visa_duration_days} days` : ""}
            </p>
          )}
          {isFallback && (
            <Note tone="amber">
              General India checklist — confirm exact requirements with the destination embassy.
            </Note>
          )}
        </div>
      </Reveal>

      <MoreHint show={!expanded && tail.length > 0}>
        {tail.length} more document{tail.length > 1 ? "s" : ""} — hover to see them all
      </MoreHint>
    </div>
  );
}

// --- Timeline (derived from ward / ICU days) -------------------------------

function TimelineBody({ cost, procedureLabel, expanded, reduce }) {
  const steps = buildTimeline(cost, procedureLabel);
  const COLLAPSED = 3;
  const head = steps.slice(0, COLLAPSED);
  const tail = steps.slice(COLLAPSED);

  const Step = (s, i, isLast) => (
    <li key={i} className="ml-4 pb-1">
      <span className={`absolute -left-[7px] w-3 h-3 rounded-full border-2 border-[var(--color-surface)] ${isLast ? "bg-emerald-500" : "bg-[var(--color-accent)]"}`} />
      <p className="text-xs font-bold text-[var(--color-accent)]">{s.day}</p>
      <p className="text-xs text-[var(--color-text-secondary)]">{s.label}</p>
    </li>
  );

  return (
    <div>
      <ol className="relative border-l-2 border-[var(--color-border)] ml-1 space-y-3">
        {head.map((s, i) => Step(s, i, tail.length === 0 && i === head.length - 1))}
        <Reveal show={expanded && tail.length > 0} reduce={reduce}>
          <div className="space-y-3 pt-3">
            {tail.map((s, i) => Step(s, i + COLLAPSED, i === tail.length - 1))}
          </div>
        </Reveal>
      </ol>
      {!expanded && tail.length > 0 ? (
        <MoreHint show>{tail.length} more step{tail.length > 1 ? "s" : ""} — hover for the full recovery path</MoreHint>
      ) : (
        <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">Indicative recovery timeline.</p>
      )}
    </div>
  );
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
    const start = cur + 1;
    const end = cur + ward;
    steps.push({ day: start === end ? `Day ${start}` : `Day ${start}–${end}`, label: "Ward recovery & physio" });
    cur = end;
  }
  steps.push({ day: `Day ${cur + 2}`, label: "Discharge & fit-to-fly" });
  return steps;
}

// --- AI recommendation summary --------------------------------------------

function AISummary({ summary, isLoading }) {
  const text = extractSummary(summary);

  if (!text) {
    if (!isLoading) return null;
    return (
      <div className="bg-[var(--color-accent-subtle)] border border-[var(--color-accent-muted)] rounded-xl px-5 py-4">
        <SummaryHeader />
        <div className="mt-2 space-y-2 animate-pulse">
          <div className="h-3 bg-[var(--color-accent-subtle)] rounded w-full" />
          <div className="h-3 bg-[var(--color-accent-subtle)] rounded w-4/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-accent-subtle)] border border-[var(--color-accent-muted)] rounded-xl px-5 py-4">
      <SummaryHeader />
      <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed" dir="auto">{text}</p>
    </div>
  );
}

function SummaryHeader() {
  return (
    <div className="flex items-center gap-1.5 text-[var(--color-accent)]">
      <IconSparkle className="w-4 h-4" />
      <h3 className="text-[11px] font-bold tracking-wider uppercase">AI recommendation summary</h3>
    </div>
  );
}

// Use the agent's opening line(s) — everything before its first markdown heading.
function extractSummary(summary) {
  if (!summary || typeof summary !== "string") return "";
  const trimmed = summary.trim();
  if (!trimmed) return "";
  const headingAt = trimmed.search(/\n\s*#{1,6}\s/);
  let intro = headingAt > 0 ? trimmed.slice(0, headingAt) : trimmed;
  intro = intro.replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
  if (intro.length > 360) intro = intro.slice(0, 357).trimEnd() + "…";
  return intro;
}

// --- Booking confirmation --------------------------------------------------

function BookingBanner({ booking }) {
  if (booking?.status === "error") return null;
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-start gap-3">
      <IconCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold text-green-800">Appointment request sent</p>
        {booking?.reference && (
          <p className="text-green-700">
            Reference <span className="font-mono font-semibold">{booking.reference}</span>
            {booking?.hospital_name ? ` · ${booking.hospital_name}` : ""}
          </p>
        )}
        {booking?.message && <p className="text-green-600 mt-1">{booking.message}</p>}
      </div>
    </div>
  );
}

// --- Flights ---------------------------------------------------------------

function FlightsBody({ flight, cost, expanded, reduce }) {
  if (!flight) return <p className="text-sm text-[var(--color-text-secondary)]">Searching flights…</p>;

  // New shape exposes each direction (outbound + return) with per-leg detail.
  // Fall back to treating the flat shape as a single direction (one-way / old data).
  const directions = Array.isArray(flight.directions) && flight.directions.length
    ? flight.directions
    : [flight];
  const roundTrip = directions.length > 1;

  const fareItem = (cost?.line_items || []).find((li) => li?.label === "Flights");
  const fareUsd = fmtUsd(fareItem?.usd);
  const fareNative = Number.isFinite(flight.published_fare)
    ? `${flight.published_fare.toLocaleString("en-IN")} ${flight.currency || ""}`.trim()
    : null;

  return (
    <div className="space-y-2.5">
      {directions.map((dir, i) => (
        <FlightDirection key={i} dir={dir} isReturn={roundTrip && i > 0} expanded={expanded} reduce={reduce} />
      ))}

      {(fareUsd || fareNative) && (
        <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
            {roundTrip ? "Round-trip airfare" : "Airfare"}
          </span>
          <span className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
            {fareUsd || fareNative}
            {fareUsd && fareNative && (
              <span className="text-[11px] font-normal text-[var(--color-text-tertiary)] ml-1">({fareNative})</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// One direction (Outbound or Return). The summary (route + stops + duration) is
// always visible; the per-leg itinerary + layovers reveal on hover.
function FlightDirection({ dir, isReturn, expanded, reduce }) {
  const legs = Array.isArray(dir?.legs) && dir.legs.length ? dir.legs : null;
  const stops = Number.isFinite(dir?.stops)
    ? (dir.stops === 0 ? "non-stop" : `${dir.stops} stop${dir.stops > 1 ? "s" : ""}`)
    : null;
  const meta = [stops, fmtDuration(dir?.duration_minutes)].filter(Boolean).join(" · ");
  const day = fmtDay(dir?.departure);

  return (
    <div className="rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] p-2.5">
      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mb-1.5">
        <IconPlane className={`w-3.5 h-3.5 ${isReturn ? "text-[var(--color-text-tertiary)]" : "text-[var(--color-accent)]"}`} />
        <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
          {dir?.label || (isReturn ? "Return" : "Outbound")}
        </span>
        {day && <span className="text-[11px] text-[var(--color-text-tertiary)]">· {day}</span>}
        <span className="text-xs font-bold text-[var(--color-text-primary)] ml-auto">
          {dir?.from || "—"} → {dir?.to || "—"}
        </span>
      </div>
      {meta && <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1">{meta}</div>}

      {legs ? (
        <>
          <Reveal show={expanded} reduce={reduce}>
            <div className="space-y-1.5 pt-1">
              {legs.map((leg, j) => (
                <div key={j}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--color-text-primary)]">{leg.from} → {leg.to}</span>
                    <span className="text-[var(--color-text-tertiary)]">{leg.flight_number || ""}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                    <span>{fmtDateTime(leg.departure)} → {fmtDateTime(leg.arrival)}</span>
                    {leg.airline && <span className="truncate ml-2 text-[var(--color-text-tertiary)]">{leg.airline}</span>}
                  </div>
                  {j < legs.length - 1 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 my-1">
                      ↳ layover{fmtLayover(leg.arrival, legs[j + 1].departure)
                        ? ` ${fmtLayover(leg.arrival, legs[j + 1].departure)}`
                        : ""} in {leg.to}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
          {!expanded && (
            <p className="text-[10px] font-medium text-[var(--color-accent)] opacity-80">
              {legs.length} flight{legs.length > 1 ? "s" : ""} — hover for the itinerary
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
          <span>Dep {fmtDateTime(dir?.departure)}</span>
          <span>Arr {fmtDateTime(dir?.arrival)}</span>
        </div>
      )}
    </div>
  );
}

// --- Final estimate (treatment + flights vs budget) ------------------------

function FinalEstimate({ cost, intake, isLoading, flightsPending }) {
  // Only meaningful once a priced estimate exists; the grid panels show the
  // loading skeletons in the meantime, so just stay hidden until then.
  if (!cost || cost.status === "unavailable") return null;

  const totalMin = cost.total_usd_min;
  const totalMax = cost.total_usd_max;
  if (!Number.isFinite(totalMin) && !Number.isFinite(totalMax)) return null;

  const includesFlights = !!cost.includes_flights;
  const flightItem = (cost.line_items || []).find((li) => li?.label === "Flights");
  const flightUsd = Number.isFinite(flightItem?.usd) ? flightItem.usd : null;

  const totalUsd = range(totalMin, totalMax, fmtUsd);
  const totalInr = range(cost.total_inr_min, cost.total_inr_max, fmtInr);

  // Treatment portion = grand total minus the fixed flight add-on.
  const treatMin = Number.isFinite(totalMin) && flightUsd != null ? totalMin - flightUsd : totalMin;
  const treatMax = Number.isFinite(totalMax) && flightUsd != null ? totalMax - flightUsd : totalMax;
  const treatUsd = range(treatMin, treatMax, fmtUsd);

  const budget = Number.isFinite(intake?.budget_usd) && intake.budget_usd > 0 ? intake.budget_usd : null;
  const within = budget != null && Number.isFinite(totalMax) && totalMax <= budget;
  const overBy = budget != null && Number.isFinite(totalMax) && totalMax > budget ? totalMax - budget : 0;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl px-5 py-4 text-white shadow-md">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <IconWallet className="w-4 h-4" />
          <h3 className="text-[11px] font-bold tracking-wider uppercase opacity-90">
            Final estimate {includesFlights ? "· treatment + flights" : "· treatment"}
          </h3>
        </div>
        {flightsPending ? (
          <span className="text-[11px] font-semibold bg-[var(--color-surface)]/15 border border-white/30 rounded-full px-2.5 py-1 flex items-center gap-1.5">
            <Spinner className="w-3 h-3" /> adding live flights<AnimatedDots />
          </span>
        ) : budget != null ? (
          within ? (
            <span className="text-[11px] font-semibold bg-emerald-400/25 border border-emerald-200/50 rounded-full px-2.5 py-1">
              ✓ Within your ${budget.toLocaleString("en-US")} budget
            </span>
          ) : (
            <span className="text-[11px] font-semibold bg-amber-400/25 border border-amber-200/50 rounded-full px-2.5 py-1">
              ≈ ${Math.round(overBy).toLocaleString("en-US")} over your ${budget.toLocaleString("en-US")} budget
            </span>
          )
        ) : (
          <span className="text-[11px] font-semibold bg-[var(--color-surface)]/15 border border-white/30 rounded-full px-2.5 py-1">
            Best-value plan
          </span>
        )}
      </div>

      <p className="mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums leading-tight">{totalUsd}</p>
      {totalInr && <p className="text-xs opacity-80 tabular-nums">{totalInr}</p>}

      {includesFlights && (
        <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="opacity-90">Treatment <b>{treatUsd || "—"}</b></span>
          <span className="opacity-60">+</span>
          <span className="opacity-90">Flights <b>{fmtUsd(flightUsd) || "—"}</b></span>
        </div>
      )}

      <p className="mt-2 text-[11px] opacity-70">
        {includesFlights
          ? "Treatment package + selected flight. Accommodation estimated separately."
          : "Treatment package only — flights and accommodation estimated separately."}
      </p>
    </div>
  );
}

const _MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-06-25T05:55:00" -> "25 Jun, 05:55"
function fmtDateTime(s) {
  if (!s || typeof s !== "string") return "—";
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return s;
  const [, , mo, d, hh, mm] = m;
  return `${parseInt(d, 10)} ${_MONTHS[parseInt(mo, 10) - 1]}, ${hh}:${mm}`;
}

// "2026-06-25T05:55:00" -> "25 Jun"
function fmtDay(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [, , mo, d] = m;
  return `${parseInt(d, 10)} ${_MONTHS[parseInt(mo, 10) - 1]}`;
}

// minutes -> "9h 35m"
function fmtDuration(min) {
  if (!Number.isFinite(min) || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h ? h + "h " : ""}${m ? m + "m" : ""}`.trim() || null;
}

function _parseDt(s) {
  const m = s?.match?.(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, hh, mm] = m;
  return new Date(+y, +mo - 1, +d, +hh, +mm);
}

// gap between a leg's arrival and the next leg's departure -> "2h 10m"
function fmtLayover(arr, dep) {
  const a = _parseDt(arr);
  const d = _parseDt(dep);
  if (!a || !d) return "";
  const min = Math.round((d - a) / 60000);
  if (min <= 0 || min > 24 * 60) return "";
  const h = Math.floor(min / 60);
  const mm = min % 60;
  return `${h ? h + "h " : ""}${mm ? mm + "m" : ""}`.trim();
}

// --- Shared bits -----------------------------------------------------------

function Note({ children, tone = "blue" }) {
  const styles = {
    blue: "bg-[var(--color-accent-subtle)] border-[var(--color-accent-muted)] text-[var(--color-accent-hover)]",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  }[tone];
  return <p className={`text-xs border rounded-lg px-3 py-2 ${styles}`}>{children}</p>;
}

// --- Derivation + formatting helpers ---------------------------------------

// Presentational match score: deterministic, derived from rank + budget fit.
function matchInfo(h, index, status) {
  if (status === "general_recommendation") return { pct: null, label: "Accredited option" };
  let pct = 98 - index * 7;
  if (h?.within_budget === false) pct -= 8;
  if (h?.international_desk) pct += 1;
  pct = Math.max(62, Math.min(99, pct));
  const label = index === 0 ? "Best match" : pct >= 85 ? "Strong fit" : "Good option";
  return { pct, label };
}

function fmtUsd(n) {
  return typeof n === "number" && isFinite(n) ? `$${n.toLocaleString("en-US")}` : null;
}
function fmtInr(n) {
  return typeof n === "number" && isFinite(n) ? `₹${n.toLocaleString("en-IN")}` : null;
}
function range(min, max, fmt) {
  const a = fmt(min);
  const b = fmt(max);
  if (a && b) return a === b ? a : `${a} – ${b}`;
  return a || b || null;
}
function labelize(slug) {
  if (!slug || typeof slug !== "string") return null;
  const text = slug.replace(/[-_]/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : null;
}
function capitalize(s) {
  return typeof s === "string" && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function countryLabel(code) {
  if (!code) return null;
  if (code === "GENERIC" || code === "OTHER") return "Other";
  return COUNTRY_NAME[code] || code;
}
// --- Inline icons (thin slate line icons to match the mockup) --------------

function IconClipboard({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function IconHospital() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m9-14v4m-2-2h4M9 21v-3a1 1 0 011-1h4a1 1 0 011 1v3" />
    </svg>
  );
}
function IconCost() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h4M5 3h14a0 0 0 010 0v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z" />
    </svg>
  );
}
function IconChecklist() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 14l2 2 4-4" />
    </svg>
  );
}
function IconTimeline() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconCheck({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconX({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconSparkle({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l1.9 4.6L18.5 8.5 13.9 10.4 12 15l-1.9-4.6L5.5 8.5l4.6-1.9L12 2zM18 14l.9 2.1 2.1.9-2.1.9L18 20l-.9-2.1-2.1-.9 2.1-.9L18 14z" />
    </svg>
  );
}
function IconPlane({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19l1.5-4 4.5-1.5M3 10.5l18-6-6 18-3.5-7.5L3 10.5z" />
    </svg>
  );
}
function IconArrow({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function IconWallet({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h15a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 0a2 2 0 012-2h11M16 13h2" />
    </svg>
  );
}
function IconChevron({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconDownload({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  );
}
function IconHeart({ className = "w-4 h-4", filled = false }) {
  return (
    <svg className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}
