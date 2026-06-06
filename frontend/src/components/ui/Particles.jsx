// Lightweight floating particles — pure CSS animation, no canvas, GPU-friendly.
// Deterministic positions (no Math.random) so SSR/build stay stable.

const PARTICLES = [
  { left: "8%", top: "20%", size: 6, delay: "0s", dur: "7s", tone: "brand" },
  { left: "18%", top: "70%", size: 4, delay: "1.2s", dur: "9s", tone: "accent" },
  { left: "32%", top: "35%", size: 8, delay: "0.6s", dur: "8s", tone: "brand" },
  { left: "47%", top: "78%", size: 5, delay: "2s", dur: "10s", tone: "accent" },
  { left: "63%", top: "25%", size: 7, delay: "0.3s", dur: "7.5s", tone: "brand" },
  { left: "74%", top: "60%", size: 4, delay: "1.6s", dur: "9.5s", tone: "accent" },
  { left: "85%", top: "32%", size: 6, delay: "0.9s", dur: "8.5s", tone: "brand" },
  { left: "92%", top: "72%", size: 5, delay: "2.4s", dur: "11s", tone: "accent" },
];

export default function Particles({ className = "" }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`absolute rounded-full animate-drift-y ${
            p.tone === "brand" ? "bg-brand-400/40" : "bg-accent-400/40"
          }`}
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
    </div>
  );
}
