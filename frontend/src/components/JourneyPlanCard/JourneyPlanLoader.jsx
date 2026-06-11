/*
 * JourneyPlanLoader.jsx — Medical Journey flight-route loader.
 *
 * Adapted from the Claude Design "Medical Journey Loader": a plane arcs along a
 * dashed airline-route through five milestone nodes (Flight Details → Hospitals
 * → Estimated Cost → Required Documents → Summary). Each node pulses and gets a
 * checkmark as the plane passes; a status line narrates the current step.
 *
 * The plane position tracks the ACTUAL generation progress (how many planning
 * tools have completed) — it advances as work finishes and does NOT loop. The
 * background is transparent and all colours come from the site theme tokens, so
 * it sits cleanly in the chat in light and dark mode. Shown by MessageBubble
 * while a planning turn streams, then replaced by the full Journey Plan card.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const STEP_LABELS = ["Flight Details", "Hospitals", "Estimated Cost", "Required Documents", "Summary"];
const STEP_ICONS = ["✈️", "🏥", "💰", "📄", "📋"];
const FRACTIONS = [0.08, 0.29, 0.5, 0.71, 0.92];
const PATH_D = "M 12 132 Q 362 36 712 132";

// The four planning tools whose completion drives the plane forward.
const PLAN_TOOLS = ["find_hospitals", "flight_search", "estimate_cost", "get_document_checklist"];
const STATUS = {
  find_hospitals: "Shortlisting accredited hospitals…",
  flight_search: "Locking in your flight details…",
  estimate_cost: "Calculating your estimated cost…",
  get_document_checklist: "Compiling required documents…",
  get_hospital_cost: "Checking that hospital…",
  hotel_search: "Finding accommodation…",
  flight_farequote: "Confirming flight fares…",
  prepare_booking_summary: "Preparing your booking summary…",
};

function bez(t) {
  const u = 1 - t;
  return {
    x: u * u * 12 + 2 * u * t * 362 + t * t * 712,
    y: u * u * 132 + 2 * u * t * 36 + t * t * 132,
  };
}

// Target progress fraction (0–1) from the live tool list: each completed planning
// tool is a full step; a currently-running one nudges the plane partway.
function targetFraction(tools) {
  const list = tools || [];
  const done = PLAN_TOOLS.filter((n) => list.some((t) => t.name === n && t.status === "done")).length;
  const running = list.some((t) => PLAN_TOOLS.includes(t.name) && t.status !== "done") ? 0.5 : 0;
  return Math.min(1, (done + running) / 4);
}

function currentStatus(tools) {
  const list = tools || [];
  const running = [...list].reverse().find((t) => t.status !== "done");
  if (running && STATUS[running.name]) return STATUS[running.name];
  return "Putting together your summary…";
}

export default function JourneyPlanLoader({ tools }) {
  const basePathRef = useRef(null);
  const progRef = useRef(null);
  const planeRef = useRef(null);
  const trackOuterRef = useRef(null);

  const [pts, setPts] = useState(() => FRACTIONS.map(bez));
  const [doneCount, setDoneCount] = useState(0);
  const [scale, setScale] = useState(1);

  // Keep the latest target progress in a ref the rAF loop can read.
  const targetRef = useRef(0);
  targetRef.current = targetFraction(tools);
  const status = currentStatus(tools);

  // Measure the path → exact node points + length.
  const Lref = useRef(0);
  useLayoutEffect(() => {
    const path = basePathRef.current;
    if (path && path.getTotalLength) {
      const L = path.getTotalLength();
      Lref.current = L;
      setPts(FRACTIONS.map((f) => {
        const p = path.getPointAtLength(f * L);
        return { x: p.x, y: p.y };
      }));
    }
  }, []);

  // Scale the fixed 724px track to the available width.
  useLayoutEffect(() => {
    const el = trackOuterRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / 724));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animation: ease the plane toward the real-progress target; light nodes as it passes.
  useEffect(() => {
    const path = basePathRef.current;
    let raf = 0;
    let frac = 0;
    let lastDone = 0;

    const pointAt = (s) => {
      const L = Lref.current;
      if (path && L) {
        const c = (v) => Math.max(0, Math.min(L, v));
        const p = path.getPointAtLength(c(s));
        const q = path.getPointAtLength(c(s + 2));
        let ang;
        if (q.x === p.x && q.y === p.y) {
          const r = path.getPointAtLength(c(s - 2));
          ang = Math.atan2(p.y - r.y, p.x - r.x);
        } else {
          ang = Math.atan2(q.y - p.y, q.x - p.x);
        }
        return { x: p.x, y: p.y, ang: (ang * 180) / Math.PI };
      }
      return { x: 12, y: 132, ang: -15.3 };
    };

    const tick = (now) => {
      const L = Lref.current || 1;
      // Ease toward the target (never backward), so the plane glides between nodes.
      frac += (targetRef.current - frac) * 0.045;
      if (frac > 0.999) frac = 1;

      const p = pointAt(frac * L);
      const bob = Math.sin(now / 270) * 3.2;
      if (planeRef.current) {
        planeRef.current.style.transform = `translate(${p.x}px, ${p.y + bob}px) rotate(${p.ang}deg)`;
      }
      if (progRef.current && L) {
        progRef.current.style.strokeDasharray = String(L);
        progRef.current.style.strokeDashoffset = String(L * (1 - frac));
      }
      const dc = FRACTIONS.filter((f) => frac >= f - 0.002).length;
      if (dc !== lastDone) { lastDone = dc; setDoneCount(dc); }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 760, margin: "0 auto", background: "transparent", boxSizing: "border-box" }}
      role="status" aria-label="Planning your medical journey">

      <style>{`
        @keyframes jplPulseRing{0%{transform:scale(0.35);opacity:.9}100%{transform:scale(2.7);opacity:0}}
        @keyframes jplPopIn{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
      `}</style>

      {/* header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 2px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.2px", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>Medical Travel Planner</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{doneCount} of 5 complete</div>
      </div>

      {/* scaled track */}
      <div ref={trackOuterRef} style={{ position: "relative", width: "100%", height: 204 * scale, margin: "6px auto 0" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 724, height: 204, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <svg width="724" height="200" viewBox="0 0 724 200" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path ref={basePathRef} d={PATH_D} fill="none" stroke="var(--color-border)" strokeWidth="2.5" strokeDasharray="10 12" strokeLinecap="round" />
            <path ref={progRef} d={PATH_D} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray="0 9999" opacity="0.9" />
          </svg>

          {STEP_LABELS.map((label, i) => {
            const done = i < doneCount;
            const active = i === doneCount;
            const dotBg = done ? "var(--color-accent)" : "var(--color-surface)";
            const dotBorder = done ? "var(--color-accent)" : "var(--color-border)";
            const dotShadow = done
              ? "0 0 0 6px var(--color-accent-subtle), 0 0 18px var(--color-accent-muted)"
              : "0 1px 3px rgba(0,0,0,0.14)";
            const labelColor = done || active ? "var(--color-accent)" : "var(--color-text-tertiary)";
            const labelWeight = done || active ? 700 : 600;
            const pt = pts[i] || bez(FRACTIONS[i]);
            return (
              <div key={i} style={{ position: "absolute", left: pt.x, top: pt.y, width: 0, height: 0 }}>
                <div style={{ position: "absolute", left: -19, top: -66, width: 38, height: 38, borderRadius: "50%", background: "var(--color-surface)", border: `1.5px solid ${done ? "var(--color-accent)" : "var(--color-border)"}`, boxShadow: "0 4px 10px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: done || active ? 1 : 0.45, transition: "opacity 0.3s, border-color 0.3s" }}>{STEP_ICONS[i]}</div>
                <div style={{ position: "absolute", left: -0.75, top: -25, width: 1.5, height: 11, background: "var(--color-border)" }} />
                {done && (
                  <>
                    <div style={{ position: "absolute", left: -13, top: -13, width: 26, height: 26, borderRadius: "50%", border: "2.5px solid var(--color-accent)", animation: "jplPulseRing 0.9s ease-out both" }} />
                    <div style={{ position: "absolute", left: -13, top: -13, width: 26, height: 26, borderRadius: "50%", border: "2px solid var(--color-accent)", opacity: 0.6, animation: "jplPulseRing 1.15s ease-out 0.12s both" }} />
                  </>
                )}
                <div style={{ position: "absolute", left: -11, top: -11, width: 22, height: 22, borderRadius: "50%", boxSizing: "border-box", background: dotBg, border: `2px solid ${dotBorder}`, boxShadow: dotShadow, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s", zIndex: 2 }}>
                  {done && (
                    <svg width="11" height="11" viewBox="0 0 16 16" style={{ animation: "jplPopIn 0.35s ease-out both" }}>
                      <path d="M3 8.5 6.5 12 13 4.5" stroke="#FFFFFF" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div style={{ position: "absolute", left: -70, top: 22, width: 140, textAlign: "center", fontSize: 13, lineHeight: 1.3, fontWeight: labelWeight, color: labelColor, transition: "color 0.25s", textWrap: "pretty" }}>{label}</div>
              </div>
            );
          })}

          <div ref={planeRef} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, zIndex: 5, willChange: "transform", transform: "translate(12px, 132px) rotate(-15.3deg)" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" style={{ position: "absolute", left: -17, top: -17, transform: "rotate(90deg)", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.30))" }}>
              <path d="M21,16v-2l-8-5V3.5C13,2.67,12.33,2,11.5,2S10,2.67,10,3.5V9l-8,5v2l8-2.5V19l-2,1.5V22l3.5-1l3.5,1v-1.5L13,19v-5.5L21,16z" fill="var(--color-accent)" />
            </svg>
          </div>
        </div>
      </div>

      {/* status */}
      <div style={{ height: 30, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)" }}>{status}</div>
      </div>
    </div>
  );
}
