import { motion } from "framer-motion";
import { Workflow } from "lucide-react";
import Icon from "../ui/Icon";
import SectionHeading from "../ui/SectionHeading";
import { HOW_IT_WORKS } from "../../data/landingData";

// ---------------------------------------------------------------------------
// "How Your Medical Journey Works" — a premium international medical-travel
// roadmap. Six cards sit in a two-column staggered grid; a continuous dashed
// airline-style route snakes between their inner edges through glowing
// checkpoints, with small airplanes flying the left→right legs.
//
// The desktop stage is one fixed-ASPECT coordinate space (1140×660) so the
// route, checkpoints (DOM %) and airplanes (SVG <animateMotion>) share a single
// uniform mapping — planes never distort and rotate along the tangent.
// ---------------------------------------------------------------------------

const STAGE_W = 1140;
const STAGE_H = 660;

// Card vertical centres (% of stage) — staggered so the journey steps downward.
const CARD_TOP = [15, 26.5, 44, 55.5, 73, 84.5];
const CARD_INSET = 5; // % from the outer edge
const CARD_W = 36; // %

const isLeft = (i) => i % 2 === 0;

// Route waypoint = each card's inner edge at its vertical centre (stage px).
const LEFT_EDGE_X = ((CARD_INSET + CARD_W) / 100) * STAGE_W; // left card right edge
const RIGHT_EDGE_X = ((100 - CARD_INSET - CARD_W) / 100) * STAGE_W; // right card left edge
const WP = HOW_IT_WORKS.map((_, i) => ({
  x: isLeft(i) ? LEFT_EDGE_X : RIGHT_EDGE_X,
  y: (CARD_TOP[i] / 100) * STAGE_H,
}));

// Catmull-Rom → cubic bezier control points for a smooth spline through pts.
function crControls(pts, i) {
  const p0 = pts[i - 1] || pts[i];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[i + 2] || pts[i + 1];
  return {
    c1x: p1.x + (p2.x - p0.x) / 6,
    c1y: p1.y + (p2.y - p0.y) / 6,
    c2x: p2.x - (p3.x - p1.x) / 6,
    c2y: p2.y - (p3.y - p1.y) / 6,
    p2,
  };
}

function buildRoute(pts) {
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const c = crControls(pts, i);
    d += ` C ${c.c1x.toFixed(1)} ${c.c1y.toFixed(1)}, ${c.c2x.toFixed(1)} ${c.c2y.toFixed(1)}, ${c.p2.x.toFixed(1)} ${c.p2.y.toFixed(1)}`;
  }
  return d;
}

const ROUTE_PATH = buildRoute(WP);
const PLANE_D =
  "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z";

const cpLeft = (i) => `${(WP[i].x / STAGE_W) * 100}%`;
const cpTop = (i) => `${CARD_TOP[i]}%`;

// Glowing checkpoint sitting where the route meets a card edge.
function CheckpointDot() {
  return (
    <span className="relative flex h-4 w-4 items-center justify-center">
      <span className="pointer-events-none absolute -inset-2 rounded-full bg-brand-500/25 blur-[4px]" />
      <span className="pointer-events-none absolute inset-0 rounded-full bg-brand-400/40 animate-pulse-ring" />
      <span className="relative h-3 w-3 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 shadow-[0_0_10px_2px_rgba(56,130,246,0.8)] ring-4 ring-slate-50 dark:ring-slate-950" />
    </span>
  );
}

// Circular icon chip. Light mode: a crisp solid-blue, slightly elevated chip
// with a white icon. Dark mode: the reference's deep navy glowing well.
function IconTile({ name }) {
  return (
    <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_8px_18px_-6px_rgba(37,99,235,0.55)] ring-1 ring-brand-300/50 dark:from-brand-500/25 dark:via-brand-700/30 dark:to-brand-950/50 dark:text-brand-200 dark:shadow-[0_0_20px_-4px_rgba(56,130,246,0.7)] dark:ring-brand-400/40">
      <span className="pointer-events-none absolute inset-0 rounded-full bg-brand-400/25 animate-pulse-ring" />
      <span className="pointer-events-none absolute inset-[2px] rounded-full bg-gradient-to-b from-white/30 to-transparent dark:from-white/10" />
      <Icon name={name} className="relative h-[22px] w-[22px]" strokeWidth={2} />
    </span>
  );
}

// Glassmorphism card: glowing icon (left) + title + description.
function MilestoneCard({ item }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_14px_44px_-16px_rgba(15,23,42,0.22)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-300/70 hover:shadow-[0_24px_56px_-18px_rgba(37,99,235,0.35)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_0_0_1px_rgba(56,130,246,0.06),0_18px_50px_-18px_rgba(0,0,0,0.6)] dark:hover:border-brand-400/40 dark:hover:shadow-[0_0_0_1px_rgba(56,130,246,0.18),0_0_46px_-10px_rgba(56,130,246,0.5)] sm:p-6"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/20" />
      <IconTile name={item.icon} />
      <div className="min-w-0">
        <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {item.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="section-pad relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-light bg-grid opacity-30 mask-fade dark:bg-grid-dark" />
        <div className="absolute left-1/2 top-1/3 h-[460px] w-[680px] -translate-x-1/2 rounded-full bg-brand-500/[0.07] blur-3xl dark:bg-brand-500/15" />
      </div>

      <div className="container-x relative">
        <SectionHeading
          eyebrow="How it Works"
          icon={<Workflow className="h-3.5 w-3.5" />}
          title={
            <>
              How Your <span className="text-gradient">Medical Journey</span> Works
            </>
          }
          subtitle="MVT Bridge coordinates every step — from hospital matching to travel and recovery."
        />

        {/* ── Desktop: two-column staggered roadmap ──────────────────────── */}
        <div className="relative mx-auto mt-16 hidden aspect-[1140/660] w-full max-w-6xl lg:block">
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            aria-hidden="true"
          >
            {/* dashed airline route */}
            <path
              id="journeyRoute"
              d={ROUTE_PATH}
              vectorEffect="non-scaling-stroke"
              stroke="url(#routeLine)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="1 11"
              style={{ filter: "drop-shadow(0 0 2.5px rgba(56,130,246,0.5))" }}
            />

            {/* a single airplane tracing the entire journey, slow and cinematic */}
            <g style={{ filter: "drop-shadow(0 0 2px rgba(56,130,246,0.7))" }}>
              <animateMotion dur="16s" repeatCount="indefinite" rotate="auto">
                <mpath href="#journeyRoute" />
              </animateMotion>
              <g transform="rotate(45) scale(0.85) translate(-12 -12)">
                <path d={PLANE_D} className="fill-brand-600 dark:fill-white" />
              </g>
            </g>

            <defs>
              <linearGradient id="routeLine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2563eb" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          {/* checkpoints at each card edge */}
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={`cp-${item.step}`}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: cpLeft(i), top: cpTop(i) }}
            >
              <CheckpointDot />
            </div>
          ))}

          {/* staggered cards */}
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={item.step}
              className={`absolute z-10 -translate-y-1/2 ${isLeft(i) ? "left-[5%]" : "right-[5%]"}`}
              style={{ top: cpTop(i), width: `${CARD_W}%` }}
            >
              <MilestoneCard item={item} />
            </div>
          ))}
        </div>

        {/* ── Mobile / tablet: vertical journey timeline ─────────────────── */}
        <div className="relative mt-14 lg:hidden">
          <span className="pointer-events-none absolute bottom-5 left-[7px] top-5 w-px border-l border-dashed border-brand-300/70 dark:border-brand-400/45" />
          <div className="space-y-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative flex items-center gap-4">
                <div className="relative z-10 flex-shrink-0">
                  <CheckpointDot />
                </div>
                <div className="min-w-0 flex-1">
                  <MilestoneCard item={item} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
