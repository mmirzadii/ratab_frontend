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
      colors: {
        ratab: {
          night: "#05050a",
          panel: "#0f172a",
          emerald: "#10b981",
          teal: "#14b8a6",
          violet: "#8b5cf6",
          amber: "#f59e0b"
        }
      },
      boxShadow: {
        "emerald-soft": "0 0 34px rgba(16, 185, 129, 0.18)",
        "violet-soft": "0 0 30px rgba(139, 92, 246, 0.16)"
      }
    }
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", '[data-theme="light"] &');
    })
  ]
} satisfies Config;
