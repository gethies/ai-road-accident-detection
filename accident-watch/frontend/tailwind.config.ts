import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "red-alert": "#D9232D",
        "night-road": "#0D1117",
        asphalt: "#1E2530",
        "lane-yellow": "#F5C842",
        "safe-green": "#22C55E",
        "mist-white": "#E8ECF0",
        "dim-gray": "#6B7280",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      animation: {
        "radar-ping": "radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        "radar-ping": {
          "0%": { transform: "scale(0.5)", opacity: "0.8" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
