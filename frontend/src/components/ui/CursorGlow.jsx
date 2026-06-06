import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Soft glow that trails the cursor — desktop (fine pointer) only.
 * Disabled on touch devices and when reduced motion is requested.
 */
export default function CursorGlow() {
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 180, damping: 25, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 25, mass: 0.4 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);

    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ left: sx, top: sy }}
      className="pointer-events-none fixed z-[55] hidden -translate-x-1/2 -translate-y-1/2 lg:block"
    >
      <div className="h-[400px] w-[400px] rounded-full bg-brand-400/10 blur-[90px] dark:bg-brand-400/15" />
    </motion.div>
  );
}
