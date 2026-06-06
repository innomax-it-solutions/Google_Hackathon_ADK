/**
 * Abstract medical + AI network visual: nodes connected by lines with a pulsing
 * core. Decorative only (aria-hidden). Uses currentColor for theme adaptability.
 */
export default function MedicalNetwork({ className = "" }) {
  const nodes = [
    { cx: 60, cy: 60 },
    { cx: 240, cy: 50 },
    { cx: 330, cy: 150 },
    { cx: 250, cy: 250 },
    { cx: 70, cy: 230 },
    { cx: 30, cy: 150 },
  ];
  const center = { cx: 180, cy: 150 };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 360 300"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="mn-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <radialGradient id="mn-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </radialGradient>
      </defs>

      {/* connections */}
      {nodes.map((n, i) => (
        <line
          key={`l-${i}`}
          x1={center.cx}
          y1={center.cy}
          x2={n.cx}
          y2={n.cy}
          stroke="url(#mn-line)"
          strokeWidth="1.5"
          strokeOpacity="0.35"
        />
      ))}

      {/* outer nodes */}
      {nodes.map((n, i) => (
        <g key={`n-${i}`}>
          <circle cx={n.cx} cy={n.cy} r="7" fill="url(#mn-line)" fillOpacity="0.9" />
          <circle cx={n.cx} cy={n.cy} r="7" fill="none" stroke="url(#mn-line)" strokeOpacity="0.4">
            <animate
              attributeName="r"
              values="7;14;7"
              dur="3s"
              begin={`${i * 0.4}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-opacity"
              values="0.5;0;0.5"
              dur="3s"
              begin={`${i * 0.4}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* pulsing core with medical cross */}
      <circle cx={center.cx} cy={center.cy} r="26" fill="url(#mn-core)">
        <animate attributeName="r" values="26;29;26" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <path
        d="M180 138v24M168 150h24"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
