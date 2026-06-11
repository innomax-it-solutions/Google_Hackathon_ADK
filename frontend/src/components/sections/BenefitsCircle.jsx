import { motion } from "framer-motion";
import {
  Sparkles,
  HeartPulse,
  FileText,
  Plane,
  Headset,
  ShieldCheck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// BenefitsCircle — the premium AI-healthcare ecosystem visual used as the
// Hero's right-side graphic.
//
// Geometry: a square stage of STAGE px with node centres on a single orbit via
// x = CENTER + RADIUS*cos(θ), y = CENTER + RADIUS*sin(θ). Everything visual
// (rings, connector lines, glow, glass nodes) is layered on top of that exact
// symmetry. Built only from divs / borders / icons / gradients (Lucide icons,
// no images).
//
// This module exports BenefitsCircleStage — just the 600px stage — so the Hero
// can scale and position it freely without inheriting any section chrome.
// ---------------------------------------------------------------------------

const STAGE = 600; // square stage edge (px)
const CENTER = STAGE / 2; // 300 — both axes
const RADIUS = 250; // orbit radius the icon-card centres sit on

// Icon-accent palettes (Blue / Green / Purple per the brief).
const TONES = {
  blue: "text-brand-600",
  green: "text-emerald-600",
  purple: "text-violet-600",
};

// Clockwise from the top; angles in degrees → perfectly even 60° spacing.
const NODES = [
  { angle: -90, icon: Sparkles, tone: "blue", label: "AI-Powered Hospital Match" },
  { angle: -30, icon: HeartPulse, tone: "green", label: "Best Treatment Options" },
  { angle: 30, icon: FileText, tone: "purple", label: "Visa & Document Support" },
  { angle: 90, icon: Plane, tone: "blue", label: "Travel & Stay Support" },
  { angle: 150, icon: Headset, tone: "green", label: "24/7 Patient Support" },
  { angle: 210, icon: ShieldCheck, tone: "purple", label: "Transparent Pricing" },
];

// Midpoint angles between the six cards — tiny glowing accent nodes that ride
// the orbit and give the ring a polished "network" rhythm.
const ORBIT_DOTS = [-60, 0, 60, 120, 180, 240];

// Trig position on the orbit, returned as percentages of the stage so the
// layout scales fluidly with the (responsive) stage size.
function nodePosition(angle) {
  const rad = (angle * Math.PI) / 180;
  const x = CENTER + RADIUS * Math.cos(rad);
  const y = CENTER + RADIUS * Math.sin(rad);
  return { left: `${(x / STAGE) * 100}%`, top: `${(y / STAGE) * 100}%` };
}

// Outer orbit diameter as a % of the stage — stroke passes exactly through the
// node-card centres (diameter = 2 * RADIUS).
const ORBIT_PCT = `${((RADIUS * 2) / STAGE) * 100}%`;

// Faint radial connector from the centre out to each node, drawn as a thin
// rotated bar anchored at the centre point (origin-left).
function ConnectorLine({ angle }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 h-px origin-left"
      style={{
        width: RADIUS,
        transform: `rotate(${angle}deg)`,
        background:
          "linear-gradient(to right, rgba(59,130,246,0) 0%, rgba(59,130,246,0.45) 100%)",
        opacity: 0.08,
      }}
    />
  );
}

function FeatureNode({ node, index }) {
  const { icon: IconCmp, tone, label } = node;
  const pos = nodePosition(node.angle);

  return (
    // Static wrapper owns the orbit anchoring + translate(-50%,-50%) centring
    // of the ICON card (not the label). Keeping it OFF the motion element is
    // essential: Framer Motion rebuilds `transform` from its own motion values
    // when animating scale, which would otherwise clobber this translate and
    // shift the card down/right.
    <div
      className="absolute"
      style={{ left: pos.left, top: pos.top, transform: "translate(-50%, -50%)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{
          duration: 0.55,
          delay: 0.25 + index * 0.09,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* Slow, staggered float keeps the cluster alive but calm. */}
        <div
          className="group relative animate-float"
          style={{ animationDelay: `${index * 0.7}s` }}
        >
          {/* Soft glow halo — always faintly lit, blooming on hover. */}
          <span className="pointer-events-none absolute -inset-2 rounded-[26px] bg-brand-400/10 blur-md transition-all duration-500 group-hover:bg-brand-400/25 dark:bg-brand-400/15" />
          <span
            className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-white/90 bg-white shadow-[0_10px_28px_-10px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-slate-900/[0.04] backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_18px_40px_-12px_rgba(37,99,235,0.45)] dark:border-white/15 dark:ring-white/10 dark:shadow-[0_0_0_1px_rgba(56,130,246,0.18),0_12px_34px_-10px_rgba(56,130,246,0.55)] ${TONES[tone]}`}
          >
            <IconCmp className="h-7 w-7" strokeWidth={2.1} />
          </span>
          {/* Label sits absolutely below the card → never shifts the geometry.
              High-contrast + semi-bold so it stays crisply readable in both
              themes (bright white on dark, deep slate on light). */}
          <p className="absolute left-1/2 top-full mt-4 w-[128px] -translate-x-1/2 text-center text-[15px] font-semibold leading-snug text-slate-700 dark:text-white">
            {label}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// The bare 600px orbit stage — no section wrapper, heading or tagline. The
// caller is responsible for scaling/positioning it (e.g. the Hero visual).
export default function BenefitsCircleStage() {
  return (
    <div className="relative" style={{ width: STAGE, height: STAGE }}>
      {/* Ambient radial glow — cinematic depth behind the whole ecosystem.
          A restrained blue wash in light mode, a deeper neon bloom in dark. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.12)_0%,_transparent_60%)] blur-2xl dark:bg-[radial-gradient(circle,_rgba(56,130,246,0.30)_0%,_transparent_58%)]" />
      </div>

      {/* Concentric structural rings — layered for premium depth and to draw
          the eye toward the core. Blue-tinted and brighter in dark mode. */}
      <div className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/60 dark:border-white/[0.06]" />
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-200/50 dark:border-brand-400/15" />
      <div className="absolute left-1/2 top-1/2 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-300/40 dark:border-brand-400/20" />

      {/* Orbit path — a brighter dotted ring with a soft glow hugging the line;
          stroke passes exactly through every node-card centre. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dotted border-brand-300/70 shadow-[0_0_18px_rgba(59,130,246,0.22)] dark:border-brand-400/45 dark:shadow-[0_0_24px_rgba(56,130,246,0.4)]"
        style={{ width: ORBIT_PCT, height: ORBIT_PCT }}
      />

      {/* Radial connector lines (behind cards) */}
      {NODES.map((node) => (
        <ConnectorLine key={`line-${node.label}`} angle={node.angle} />
      ))}

      {/* Tiny glowing nodes on the orbit, midway between each card. */}
      {ORBIT_DOTS.map((angle) => {
        const pos = nodePosition(angle);
        return (
          <span
            key={`dot-${angle}`}
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400 shadow-[0_0_8px_2px_rgba(56,130,246,0.5)] dark:bg-brand-300 dark:shadow-[0_0_10px_3px_rgba(56,130,246,0.7)]"
            style={{ left: pos.left, top: pos.top }}
          />
        );
      })}

      {/* Center card — the glowing AI-healthcare core. The static wrapper owns
          the exact-centre positioning (left/top 50% + translate(-50%,-50%)) so
          it can NEVER be clobbered by Framer Motion, which rebuilds `transform`
          from its own motion values while animating scale. The motion element
          inside only animates opacity + scale, and scale uses the default
          centre transform-origin → the core stays the true geometric centre. */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* Layered neon rings + a slow breathing halo behind the core. Each
              animated glow lives on a translate-centred WRAPPER with the
              animation on the inner element, so the pulse can never clobber the
              centring transform. */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2">
            <div className="h-full w-full animate-glow rounded-full bg-brand-500/[0.10] blur-2xl dark:bg-brand-400/25" />
          </div>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[212px] w-[212px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-300/40 dark:border-brand-400/30" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[194px] w-[194px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-200/50 shadow-[0_0_20px_rgba(59,130,246,0.18)] dark:border-brand-400/20 dark:shadow-[0_0_28px_rgba(56,130,246,0.45)]" />

          {/* Glass core — adapts cleanly between light (soft elevation) and dark
              (neon-edged glossy glass). overflow-hidden keeps the inner
              highlights on the circular mask; everything is vertically centred
              with even padding so nothing touches the edge. */}
          <div className="relative flex h-[176px] w-[176px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-full border border-white/90 bg-gradient-to-b from-white via-white to-slate-50 text-center shadow-[0_22px_48px_-14px_rgba(37,99,235,0.22),0_8px_22px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,0.95)] backdrop-blur-xl dark:border-brand-400/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-[0_0_50px_-6px_rgba(56,130,246,0.55),0_10px_30px_rgba(2,6,23,0.65),inset_0_1px_1px_rgba(255,255,255,0.10)]">
            {/* Glossy top-light highlight (both modes) + a soft blue radial
                sheen that only renders in dark mode for that glassy tech look. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 to-transparent dark:from-white/[0.06]" />
            <div className="pointer-events-none absolute inset-0 hidden rounded-full bg-[radial-gradient(circle_at_50%_26%,_rgba(56,130,246,0.20),_transparent_62%)] dark:block" />

            {/* Brand mark — favicon-inspired heart + heartbeat on a glowing tile */}
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 text-white shadow-[0_10px_20px_-6px_rgba(37,99,235,0.6),inset_0_1px_2px_rgba(255,255,255,0.45)] ring-1 ring-white/50 dark:shadow-[0_0_24px_-2px_rgba(56,130,246,0.85),inset_0_1px_2px_rgba(255,255,255,0.35)] dark:ring-white/15">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
              </svg>
            </span>

            {/* Wordmark · subtitle · heartbeat accent */}
            <div className="relative flex flex-col items-center gap-1.5">
              <span className="font-display text-[1.35rem] font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">
                MVT <span className="text-brand-600 dark:text-brand-300">Bridge</span>
              </span>
              <span className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.24em] text-accent-600 dark:text-accent-300">
                Medical Value Tourism
              </span>
              <svg
                viewBox="0 0 56 8"
                className="mt-0.5 h-2 w-14 animate-pulse text-accent-500 dark:text-accent-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 4h16l2-2.5 2.5 5 2.5-6 2 3.5h27" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Feature nodes */}
      {NODES.map((node, i) => (
        <FeatureNode key={node.label} node={node} index={i} />
      ))}
    </div>
  );
}
