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
import { AnimatePresence, motion } from "framer-motion";
import { COUNTRIES } from "../../constants/countries";
import { MEDBRIDGE_TRANSLATOR_LANGUAGES, languageName } from "../../constants/languages";
import { useChatContext } from "../../context/ChatContext";
import { fetchHospitalEstimate } from "../../services/api";

const COUNTRY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));

// Bump this when changing the interactive card so you can confirm in the browser
// console that the latest bundle is actually loaded (not a cached old one).
console.info("[MedBridge] JourneyPlanCard build: interactive-v4 (split cost/flights fetch)");

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
  const [cache, setCache] = useState({});
  const costReqRef = useRef(new Set());     // ids whose treatment cost was requested
  const flightReqRef = useRef(new Set());   // ids whose live flights were requested

  const { sendMessage, isStreaming } = useChatContext();

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

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <PatientHeader intake={intake} isLoading={isLoading} />

      <div className="bg-slate-50 p-4 sm:p-5 space-y-4">
        {booking && <BookingBanner booking={booking} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel icon={<IconHospital />} title="Recommended hospitals" data={hospital} isLoading={isLoading}
            render={() => (
              <HospitalsBody
                list={list}
                status={hospital?.status}
                selectedId={selectedId}
                recommendedId={recommendedId}
                cache={cache}
                onSelect={onSelect}
                onBook={onBook}
                isStreaming={isStreaming}
                supportLang={hospital?.requested_interpreter_language || intake?.support_language}
              />
            )} />

          <Panel icon={<IconCost />} title="Estimated cost" data={costPanelData} isLoading={initialSkeleton}
            render={() => selError
              ? <RetryNote onRetry={() => onSelect(selectedId)} />
              : costFetching
                ? <ProgressSteps steps={["Fetching treatment costs", "Building your plan"]} />
                : <SwapIn k={selectedId}><CostBody cost={selCost} flightsPending={flightsPending} procedureLabel={procedureLabel} /></SwapIn>} />

          <Panel icon={<IconPlane />} title="Flights" data={flightPanelData} isLoading={initialSkeleton}
            render={() => selError
              ? <RetryNote onRetry={() => onSelect(selectedId)} />
              : flightsPending
                ? <ProgressSteps steps={[`Searching live flights${selCity ? ` to ${selCity}` : ""}`, "Comparing fares", "Pricing your journey"]} />
                : <SwapIn k={selectedId}><FlightsBody flight={selectedFlight} cost={selCost} /></SwapIn>} />

          <Panel icon={<IconChecklist />} title="Travel checklist" data={docs} isLoading={isLoading}
            render={() => <ChecklistBody docs={docs} />} />

          <Panel icon={<IconTimeline />} title="Timeline" data={costPanelData} isLoading={initialSkeleton}
            render={() => costFetching
              ? <ProgressSteps steps={["Preparing recovery timeline"]} />
              : <SwapIn k={selectedId}><TimelineBody cost={selCost} procedureLabel={procedureLabel} /></SwapIn>} />
        </div>

        <CompareStrip list={list} cache={cache} selectedId={selectedId} recommendedId={recommendedId} onSelect={onSelect} />

        <SwapIn k={selectedId}>
          <FinalEstimate cost={selCost} intake={intake} isLoading={initialSkeleton} flightsPending={flightsPending} />
        </SwapIn>

        <AISummary summary={summary} isLoading={isLoading} />
      </div>
    </div>
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
    <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <IconClipboard className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Patient request
            </span>
            {isLoading && (
              <span className="flex items-center gap-1 text-[11px] text-blue-500">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                building…
              </span>
            )}
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-800 truncate">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
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
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">{children}</p>
    </div>
  );
}

// --- Panel shell -----------------------------------------------------------

function Panel({ icon, title, data, isLoading, render }) {
  let body;
  if (data) {
    try {
      body = render();
    } catch (err) {
      console.error(`[MedBridge] Failed to render "${title}":`, err);
      body = <p className="text-sm text-slate-500">See the summary below for these details.</p>;
    }
  } else if (isLoading) {
    body = <PanelSkeleton />;
  } else {
    return null; // nothing to show and not loading -> hide the panel entirely
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-1.5 mb-3 text-slate-400">
        {icon}
        <h3 className="text-[11px] font-bold tracking-wider uppercase">{title}</h3>
      </div>
      {body}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-2.5 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-5/6" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  );
}

// --- Recommended hospitals -------------------------------------------------

function HospitalsBody({ list, status, selectedId, recommendedId, cache, onSelect, onBook, isStreaming, supportLang }) {
  const isGeneral = status === "general_recommendation";

  if (!list.length) {
    const name = cache?.[recommendedId]?.cost?.hospital_name;
    if (!name) return <p className="text-sm text-slate-500">Matching you to the best hospital…</p>;
    return <p className="text-sm font-semibold text-slate-800">{name}</p>;
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-slate-400 -mt-1 mb-1">Tap a hospital to see its plan & cost.</p>
      {list.map((h, i) => {
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
            onClick={() => onSelect(h?.hospital_id)}
            aria-pressed={isSel}
            className={`w-full text-left flex items-start justify-between gap-3 rounded-lg p-2.5 transition-colors ${
              isSel ? "bg-blue-50 ring-2 ring-blue-500" : "hover:bg-slate-50 ring-1 ring-transparent"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                <span className="truncate">{h?.name || "Hospital"}</span>
                {isRec && (
                  <span className="text-[9px] font-bold uppercase tracking-wide text-blue-600 bg-blue-100 rounded px-1 py-0.5">
                    Recommended
                  </span>
                )}
                {h?.international_desk && (
                  <span className="text-[10px] font-medium text-green-600">• intl desk</span>
                )}
              </p>
              <p className="text-xs text-slate-500">
                {[h?.city, h?.tier ? `Tier ${h.tier}` : null].filter(Boolean).join(" · ")}
              </p>
              {supportLang && <InterpreterLine has={hasTranslator(h, supportLang)} lang={supportLang} />}
              {total && (
                <p className="text-[11px] mt-0.5 text-slate-500 tabular-nums">
                  {totalLabel}
                  <span className="font-semibold text-slate-700">{total}</span>
                  {!hasCost && entry?.status !== "loading" && <span className="text-slate-400"> est.</span>}
                  {entry?.status === "partial" && <span className="text-blue-500"> +flights…</span>}
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
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
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
                <p className="text-[10px] text-amber-600">tap to retry</p>
              ) : pct != null ? (
                <p className={`text-sm font-extrabold ${isSel ? "text-blue-600" : "text-slate-500"}`}>{pct}%</p>
              ) : (
                <p className="text-xs font-semibold text-slate-500">Accredited</p>
              )}
              {entry?.status !== "loading" && entry?.status !== "partial" && (
                <p className="text-[10px] text-slate-400">{label}</p>
              )}
            </div>
          </button>
        );
      })}

      {supportLang && (
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          {MEDBRIDGE_TRANSLATOR_LANGUAGES.includes(supportLang)
            ? <IconCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            : <IconX className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
          <span className={MEDBRIDGE_TRANSLATOR_LANGUAGES.includes(supportLang) ? "text-slate-600" : "text-slate-400"}>
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
    <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${has ? "text-green-600" : "text-slate-400"}`}>
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
      <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
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
              className={`h-1 rounded-full transition-all duration-300 ${k <= i ? "bg-blue-500 w-7" : "bg-slate-200 w-3"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RetryNote({ onRetry }) {
  return (
    <div className="text-sm text-slate-500 space-y-1.5">
      <p className="flex items-center gap-1.5 text-amber-600">
        <IconX className="w-4 h-4 flex-shrink-0" /> Couldn't load this hospital's estimate.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700"
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
    <svg className={`${className} animate-spin text-blue-500`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// --- Compare all three (totals side by side) -------------------------------

function CompareStrip({ list, cache, selectedId, recommendedId, onSelect }) {
  if (!Array.isArray(list) || list.length < 2) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-1.5 mb-3 text-slate-400">
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
                isSel ? "bg-blue-50 ring-2 ring-blue-500" : "bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                {h?.name || "Hospital"}
                {id === recommendedId && <span className="text-[8px] font-bold uppercase text-blue-600">★</span>}
              </p>
              <p className="text-[10px] text-slate-400 truncate mb-1.5">{h?.city}</p>
              {entry?.status === "loading" ? (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400"><Spinner className="w-3.5 h-3.5" /> pricing…</div>
              ) : unavailable ? (
                <p className="text-[11px] text-amber-600">No listed price</p>
              ) : total ? (
                <p className="text-sm font-extrabold text-slate-800 tabular-nums leading-tight">
                  {total}
                  {!hasCost && <span className="text-[10px] font-normal text-slate-400"> est.</span>}
                  {entry?.status === "partial" && <span className="block text-[9px] font-normal text-blue-500">+ flights…</span>}
                  {ready && entry.cost?.includes_flights && <span className="block text-[9px] font-normal text-slate-400">incl. flights</span>}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">Accredited</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Estimated cost --------------------------------------------------------

function CostBody({ cost, procedureLabel, flightsPending }) {
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
    return <p className="text-sm text-slate-500">Cost details are in the summary below.</p>;
  }

  return (
    <div className="space-y-3">
      {procedureLabel && (
        <p className="text-xs text-slate-500 -mt-1">{procedureLabel}</p>
      )}

      {usd && (
        <div>
          <p className="text-2xl font-extrabold text-slate-800 tabular-nums leading-tight">{usd}</p>
          {inr && <p className="text-xs text-slate-400 tabular-nums">{inr}</p>}
        </div>
      )}

      {items.length > 0 && <CostBreakdown items={items} />}

      {flightsPending && (
        <p className="text-[11px] text-blue-600 flex items-center gap-1.5">
          <Spinner className="w-3 h-3" /> Adding live flights to the total<AnimatedDots />
        </p>
      )}

      {cost?.scope_note && <p className="text-[11px] text-slate-400">{cost.scope_note}</p>}
      {cost?.currency_note && <p className="text-[11px] text-slate-400 italic">{cost.currency_note}</p>}
    </div>
  );
}

// Collapsible itemised breakdown — collapsed by default to reduce clutter.
function CostBreakdown({ items }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
        aria-expanded={open}
      >
        {open ? "Hide breakdown" : `Show breakdown (${items.length})`}
        <IconChevron className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="divide-y divide-slate-100 overflow-hidden"
          >
            {items.map((item, i) => (
              <li key={`${item?.label ?? "item"}-${i}`} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-slate-600">{item?.label || "Line item"}</span>
                <span className="text-slate-800 font-medium tabular-nums">{fmtUsd(item?.usd) || "—"}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Travel checklist ------------------------------------------------------

function ChecklistBody({ docs }) {
  const mandatory = Array.isArray(docs?.mandatory_docs) ? docs.mandatory_docs : [];
  const recommended = Array.isArray(docs?.recommended_docs) ? docs.recommended_docs : [];
  const isFallback = docs?.status === "fallback";

  // Lead with the visa, then mandatory, then recommended — all as green checks.
  const visaItem = docs?.visa_type
    ? `${docs.visa_type}${docs?.visa_required === false ? " (visa-free)" : ""}`
    : null;
  const items = [visaItem, ...mandatory, ...recommended].filter(Boolean).slice(0, 9);

  if (!items.length) {
    return (
      <p className="text-sm text-slate-500">
        Your coordinator will confirm the exact documents for your country.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
        {items.map((doc, i) => (
          <div key={`${doc}-${i}`} className="flex items-start gap-2 text-sm text-slate-700">
            <IconCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{typeof doc === "string" ? doc : String(doc)}</span>
          </div>
        ))}
      </div>

      {Number.isFinite(docs?.processing_days) && (
        <p className="text-[11px] text-slate-400">
          Visa processing ≈ {docs.processing_days} days
          {Number.isFinite(docs?.visa_duration_days) ? ` · valid ${docs.visa_duration_days} days` : ""}
        </p>
      )}

      {isFallback && (
        <Note tone="amber">
          General India checklist — confirm exact requirements with the destination embassy.
        </Note>
      )}
    </div>
  );
}

// --- Timeline (derived from ward / ICU days) -------------------------------

function TimelineBody({ cost, procedureLabel }) {
  const steps = buildTimeline(cost, procedureLabel);

  return (
    <div>
      <ol className="relative border-l-2 border-slate-200 ml-1 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="ml-4">
            <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
            <p className="text-xs font-bold text-blue-600">{s.day}</p>
            <p className="text-xs text-slate-600">{s.label}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] text-slate-400">Indicative recovery timeline.</p>
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
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
        <SummaryHeader />
        <div className="mt-2 space-y-2 animate-pulse">
          <div className="h-3 bg-blue-100 rounded w-full" />
          <div className="h-3 bg-blue-100 rounded w-4/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
      <SummaryHeader />
      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}

function SummaryHeader() {
  return (
    <div className="flex items-center gap-1.5 text-blue-600">
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

function FlightsBody({ flight, cost }) {
  if (!flight) return <p className="text-sm text-slate-500">Searching flights…</p>;

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
        <FlightDirection key={i} dir={dir} isReturn={roundTrip && i > 0} />
      ))}

      {(fareUsd || fareNative) && (
        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-wide text-slate-400">
            {roundTrip ? "Round-trip airfare" : "Airfare"}
          </span>
          <span className="text-sm font-bold text-slate-800 tabular-nums">
            {fareUsd || fareNative}
            {fareUsd && fareNative && (
              <span className="text-[11px] font-normal text-slate-400 ml-1">({fareNative})</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// One direction (Outbound or Return) with each connecting leg + layovers.
function FlightDirection({ dir, isReturn }) {
  const legs = Array.isArray(dir?.legs) && dir.legs.length ? dir.legs : null;
  const stops = Number.isFinite(dir?.stops)
    ? (dir.stops === 0 ? "non-stop" : `${dir.stops} stop${dir.stops > 1 ? "s" : ""}`)
    : null;
  const meta = [stops, fmtDuration(dir?.duration_minutes)].filter(Boolean).join(" · ");
  const day = fmtDay(dir?.departure);

  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mb-1.5">
        <IconPlane className={`w-3.5 h-3.5 ${isReturn ? "text-slate-400" : "text-blue-500"}`} />
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {dir?.label || (isReturn ? "Return" : "Outbound")}
        </span>
        {day && <span className="text-[11px] text-slate-400">· {day}</span>}
        <span className="text-xs font-bold text-slate-700 ml-auto">
          {dir?.from || "—"} → {dir?.to || "—"}
        </span>
      </div>
      {meta && <div className="text-[10px] text-slate-400 mb-2">{meta}</div>}

      {legs ? (
        <div className="space-y-1.5">
          {legs.map((leg, j) => (
            <div key={j}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{leg.from} → {leg.to}</span>
                <span className="text-slate-400">{leg.flight_number || ""}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{fmtDateTime(leg.departure)} → {fmtDateTime(leg.arrival)}</span>
                {leg.airline && <span className="truncate ml-2 text-slate-400">{leg.airline}</span>}
              </div>
              {j < legs.length - 1 && (
                <p className="text-[10px] text-amber-600 my-1">
                  ↳ layover{fmtLayover(leg.arrival, legs[j + 1].departure)
                    ? ` ${fmtLayover(leg.arrival, legs[j + 1].departure)}`
                    : ""} in {leg.to}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-slate-500">
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
          <span className="text-[11px] font-semibold bg-white/15 border border-white/30 rounded-full px-2.5 py-1 flex items-center gap-1.5">
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
          <span className="text-[11px] font-semibold bg-white/15 border border-white/30 rounded-full px-2.5 py-1">
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
    blue: "bg-blue-50 border-blue-200 text-blue-700",
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
