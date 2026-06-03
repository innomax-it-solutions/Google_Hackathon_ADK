/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
      },
      colors: {
        surface:          "var(--color-surface)",
        "surface-2":      "var(--color-surface-2)",
        overlay:          "var(--color-overlay)",
        "text-primary":   "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary":  "var(--color-text-tertiary)",
        accent: {
          DEFAULT: "var(--color-accent)",
          hover:   "var(--color-accent-hover)",
          muted:   "var(--color-accent-muted)",
          subtle:  "var(--color-accent-subtle)",
        },
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
        "composer":       "0 2px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.05)",
        "composer-focus": "0 2px 20px rgba(0,0,0,0.09), 0 0 0 3px var(--color-accent-muted)",
        "card":        "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px var(--color-border)",
        "card-hover":  "0 6px 24px rgba(0,0,0,0.10), 0 0 0 1px var(--color-accent-muted)",
        "surface":     "0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px var(--color-border)",
        "dropdown":    "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--color-border)",
      },
      animation: {
        "cursor-blink": "cursorBlink 1s ease-in-out infinite",
        "fade-in":      "fadeIn 200ms ease forwards",
        "slide-up":     "slideUp 250ms cubic-bezier(0.16,1,0.3,1) forwards",
        "pop-in":       "popIn 300ms cubic-bezier(0.16,1,0.3,1) forwards",
      },
      keyframes: {
        cursorBlink: {
          "0%,100%": { opacity: 1 },
          "50%":     { opacity: 0 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(12px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
        popIn: {
          from: { opacity: 0, transform: "scale(0.94) translateY(8px)" },
          to:   { opacity: 1, transform: "scale(1) translateY(0)" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
