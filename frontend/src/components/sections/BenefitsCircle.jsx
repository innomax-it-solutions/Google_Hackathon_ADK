import { motion } from "framer-motion";
import {
  Plus,
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
          {/* Hover glow halo — barely-there until hovered */}
          <span className="pointer-events-none absolute -inset-2 rounded-[26px] bg-brand-400/0 blur-md transition-all duration-500 group-hover:bg-brand-400/15" />
          <span
            className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-white/80 bg-white/90 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_16px_36px_-12px_rgba(37,99,235,0.25)] ${TONES[tone]}`}
          >
            <IconCmp className="h-7 w-7" strokeWidth={2} />
          </span>
          {/* Label sits absolutely below the card → never shifts the geometry. */}
          <p className="absolute left-1/2 top-full mt-3.5 w-[120px] -translate-x-1/2 text-center text-sm font-medium leading-[1.5] text-slate-500">
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
      {/* Outer orbit — dashed, faint structural frame; stroke passes
          through every node-card centre */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-brand-200/40"
        style={{ width: ORBIT_PCT, height: ORBIT_PCT }}
      />
      {/* Middle ring — faint solid structure */}
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/50" />
      {/* Inner ring that visually anchors the core into the system */}
      <div className="absolute left-1/2 top-1/2 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(59,130,246,0.08)]" />

      {/* Radial connector lines (behind cards) */}
      {NODES.map((node) => (
        <ConnectorLine key={`line-${node.label}`} angle={node.angle} />
      ))}

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
          {/* Soft, perfectly centered glow grounding the core */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/[0.07] blur-2xl" />

          <div className="relative flex h-[176px] w-[176px] flex-col items-center justify-center gap-3 rounded-full border border-white bg-white text-center shadow-[0_20px_40px_rgba(37,99,235,0.10),0_8px_20px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)]">
            {/* AI core icon — glowing blue gradient square */}
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 text-white shadow-[0_8px_18px_-6px_rgba(37,99,235,0.55),inset_0_1px_2px_rgba(255,255,255,0.45)]">
              <Plus className="h-7 w-7" strokeWidth={3} />
            </span>
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-xl font-extrabold tracking-tight text-brand-700">
                Healtour
              </span>
              <span className="text-[10px] font-semibold tracking-[0.22em] text-brand-400">
                CLICK. FLY. HEAL.
              </span>
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
