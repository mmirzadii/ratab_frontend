import plugin from "tailwindcss/plugin";
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Vazirmatn", "Inter", "ui-sans-serif", "system-ui"]
      },
      spacing: {
        "30": "7.5rem"
      },
      colors: {
        // Legacy aliases kept only where still referenced; prefer ui-* tokens.
        ratab: {
          night: "var(--ui-canvas)",
          panel: "var(--ui-surface)",
          emerald: "#10b981",
          teal: "#14b8a6",
          violet: "#8b5cf6",
          amber: "#f59e0b"
        },
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
          950: "var(--brand-950)",
          navy: "var(--brand-navy)",
          cyan: "var(--brand-cyan)",
          "cyan-dark": "var(--brand-cyan-dark)"
        },
        // Semantic UI surface / text / action tokens (theme-aware)
        ui: {
          canvas: "var(--ui-canvas)",
          surface: "var(--ui-surface)",
          "surface-subtle": "var(--ui-surface-subtle)",
          "surface-elevated": "var(--ui-surface-elevated)",
          "surface-hover": "var(--ui-surface-hover)",
          "surface-selected": "var(--ui-surface-selected)",
          "border-subtle": "var(--ui-border-subtle)",
          "border-default": "var(--ui-border-default)",
          "border-strong": "var(--ui-border-strong)",
          "text-primary": "var(--ui-text-primary)",
          "text-secondary": "var(--ui-text-secondary)",
          "text-muted": "var(--ui-text-muted)",
          "text-inverse": "var(--ui-text-inverse)",
          primary: "var(--ui-primary)",
          "primary-hover": "var(--ui-primary-hover)",
          "primary-active": "var(--ui-primary-active)",
          "primary-soft": "var(--ui-primary-soft)",
          "primary-foreground": "var(--ui-primary-foreground)",
          focus: "var(--ui-focus-ring)",
          success: "var(--ui-success)",
          "success-soft": "var(--ui-success-soft)",
          warning: "var(--ui-warning)",
          "warning-soft": "var(--ui-warning-soft)",
          danger: "var(--ui-danger)",
          "danger-soft": "var(--ui-danger-soft)",
          info: "var(--ui-info)",
          "info-soft": "var(--ui-info-soft)",
          token: "var(--ui-token-accent)",
          "token-soft": "var(--ui-token-accent-soft)",
          overlay: "var(--ui-overlay)"
        },
        // Semantic state scales (kept for success/warning/danger soft surfaces)
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22"
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03"
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a"
        }
      },
      boxShadow: {
        ui: "var(--ui-shadow)",
        "ui-sm": "var(--ui-shadow-sm)",
        "brand-soft": "0 8px 24px color-mix(in srgb, var(--ui-primary) 22%, transparent)",
        // Legacy names remapped away from emerald/violet glow
        "emerald-soft": "var(--ui-shadow-sm)",
        "violet-soft": "var(--ui-shadow-sm)"
      },
      ringColor: {
        ui: "var(--ui-focus-ring)"
      }
    }
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", '[data-theme="light"] &');
    })
  ]
} satisfies Config;
