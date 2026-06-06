/** @type {import('tailwindcss').Config} */
// Merged config: our chat tokens (via CSS vars) + the homepage-ui landing
// design system (brand/accent/ink/canvas/surface ramps, animations).
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Our chat tokens (mostly used via var(--color-*) brackets; kept harmless)
        overlay:          "var(--color-overlay)",
        "text-primary":   "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary":  "var(--color-text-tertiary)",
        // Landing design system (homepage-ui)
        brand: {
          50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
          500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554",
        },
        accent: {
          50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee",
          500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
        },
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
        },
        slate: {
          800: "#1b2335", 900: "#0f1522", 950: "#080b14",
        },
      },
      fontSize: {
        "fluid-hero": ["clamp(2.4rem, 5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "fluid-h2": ["clamp(1.85rem, 3.2vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
      },
      maxWidth: {
        "chat": "52rem",
      },
      borderRadius: {
        "2.5xl": "20px",
        "3xl":   "24px",
        "4xl":   "28px",
      },
      boxShadow: {
        // landing (homepage-ui)
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 6px 20px -8px rgba(15, 23, 42, 0.10)",
        card: "0 2px 6px -2px rgba(15, 23, 42, 0.06), 0 14px 40px -16px rgba(15, 23, 42, 0.16)",
        glow: "0 0 0 1px rgba(37, 99, 235, 0.06), 0 14px 44px -16px rgba(37, 99, 235, 0.30)",
        "glow-accent": "0 0 0 1px rgba(6, 182, 212, 0.08), 0 14px 44px -16px rgba(6, 182, 212, 0.32)",
        // our chat
        "composer":       "0 2px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.05)",
        "composer-focus": "0 2px 20px rgba(0,0,0,0.09), 0 0 0 3px var(--color-accent-muted)",
        "card-hover":  "0 6px 24px rgba(0,0,0,0.10), 0 0 0 1px var(--color-accent-muted)",
        "surface":     "0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px var(--color-border)",
        "dropdown":    "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--color-border)",
      },
      backgroundImage: {
        "grid-light":
          "linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px)",
        "grid-dark":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "hero-radial":
          "radial-gradient(60% 60% at 50% 0%, rgba(59,130,246,0.10) 0%, rgba(255,255,255,0) 70%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      keyframes: {
        // our chat
        cursorBlink: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0 } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        popIn: { from: { opacity: 0, transform: "scale(0.94) translateY(8px)" }, to: { opacity: 1, transform: "scale(1) translateY(0)" } },
        // landing
        float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-14px)" } },
        "float-slow": { "0%, 100%": { transform: "translateY(0px) translateX(0px)" }, "50%": { transform: "translateY(-22px) translateX(8px)" } },
        glow: { "0%, 100%": { opacity: "0.5", transform: "scale(1)" }, "50%": { opacity: "0.9", transform: "scale(1.06)" } },
        "gradient-x": { "0%, 100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
        aurora: { "0%, 100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        blob: {
          "0%, 100%": { borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%", transform: "translate(0px, 0px) rotate(0deg)" },
          "33%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%", transform: "translate(18px, -14px) rotate(40deg)" },
          "66%": { borderRadius: "40% 60% 55% 45% / 40% 60% 40% 60%", transform: "translate(-14px, 10px) rotate(80deg)" },
        },
        "pulse-ring": { "0%": { transform: "scale(0.85)", opacity: "0.7" }, "70%, 100%": { transform: "scale(1.9)", opacity: "0" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "drift-y": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-16px)" } },
      },
      animation: {
        // our chat
        "cursor-blink": "cursorBlink 1s ease-in-out infinite",
        "fade-in":      "fadeIn 200ms ease forwards",
        "slide-up":     "slideUp 250ms cubic-bezier(0.16,1,0.3,1) forwards",
        "pop-in":       "popIn 300ms cubic-bezier(0.16,1,0.3,1) forwards",
        // landing
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        glow: "glow 5s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        aurora: "aurora 14s ease infinite",
        shimmer: "shimmer 1.6s infinite",
        "fade-up": "fade-up 0.6s ease-out both",
        blob: "blob 18s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.6s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow": "spin-slow 24s linear infinite",
        "drift-y": "drift-y 7s ease-in-out infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
