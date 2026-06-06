/**
 * AI workflow illustration for the architecture section: an agent core with
 * orbiting tool nodes and animated dashed data-flow paths. Decorative only.
 */
export default function AIWorkflow({ className = "" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 220" fill="none" className={className}>
      <defs>
        <linearGradient id="aw-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {/* orbit rings */}
      <circle cx="110" cy="110" r="92" stroke="url(#aw-grad)" strokeOpacity="0.15" strokeWidth="1.5" />
      <circle cx="110" cy="110" r="64" stroke="url(#aw-grad)" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 6">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 110 110"
          to="360 110 110"
          dur="24s"
          repeatCount="indefinite"
        />
      </circle>

      {/* data-flow dashes */}
      {[0, 120, 240].map((angle) => (
        <line
          key={angle}
          x1="110"
          y1="110"
          x2={110 + 92 * Math.cos((angle * Math.PI) / 180)}
          y2={110 + 92 * Math.sin((angle * Math.PI) / 180)}
          stroke="url(#aw-grad)"
          strokeWidth="2"
          strokeDasharray="3 7"
          strokeOpacity="0.5"
        >
          <animate attributeName="stroke-dashoffset" values="20;0" dur="1.2s" repeatCount="indefinite" />
        </line>
      ))}

      {/* tool nodes */}
      {[0, 120, 240].map((angle, i) => {
        const cx = 110 + 92 * Math.cos((angle * Math.PI) / 180);
        const cy = 110 + 92 * Math.sin((angle * Math.PI) / 180);
        return (
          <circle key={i} cx={cx} cy={cy} r="10" fill="url(#aw-grad)">
            <animate attributeName="r" values="10;13;10" dur="2.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          </circle>
        );
      })}

      {/* agent core */}
      <circle cx="110" cy="110" r="30" fill="url(#aw-grad)" />
      <circle cx="110" cy="110" r="30" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2">
        <animate attributeName="r" values="30;36;30" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
      </circle>
      {/* spark/star glyph in core */}
      <path
        d="M110 96l3.8 8.2 8.2 3.8-8.2 3.8L110 124l-3.8-8.2-8.2-3.8 8.2-3.8z"
        fill="white"
      />
    </svg>
  );
}
