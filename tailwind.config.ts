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
        ratab: {
          night: "#05050a",
          panel: "#0f172a",
          emerald: "#10b981",
          teal: "#14b8a6",
          violet: "#8b5cf6",
          amber: "#f59e0b"
        },
        // Brand — deep navy/blue: trust, structure, identity
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554"
        },
        // Success — emerald: positive, growth, primary CTAs
        success: {
          50:  "#ecfdf5",
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
        // Warning — amber: draft, caution
        warning: {
          50:  "#fffbeb",
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
        // Danger — red: errors, destructive actions only
        danger: {
          50:  "#fef2f2",
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
        "emerald-soft": "0 0 34px rgba(16, 185, 129, 0.18)",
        "brand-soft":   "0 0 34px rgba(37, 99, 235, 0.22)",
        "violet-soft":  "0 0 30px rgba(139, 92, 246, 0.16)"
      }
    }
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", '[data-theme="light"] &');
    })
  ]
} satisfies Config;
