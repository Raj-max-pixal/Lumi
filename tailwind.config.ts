import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        lumi: {
          void: "#050505",
          purple: "#A855F7",
          glow: "#D8B4FE",
          slate: "#E2E8F0",
          mist: "#F8FAFC",
          cyan: "#22D3EE",
          pink: "#F472B6"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(168, 85, 247, 0.2), 0 12px 40px rgba(168, 85, 247, 0.22)",
        glass: "0 10px 30px rgba(5, 5, 5, 0.35)"
      },
      backgroundImage: {
        "lumi-grid":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "lumi-radial":
          "radial-gradient(circle at top, rgba(168,85,247,0.24), transparent 35%), radial-gradient(circle at 80% 20%, rgba(34,211,238,0.18), transparent 25%)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
