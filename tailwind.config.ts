import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        teal: {
          900: "#11606E", // Primary brand color
          800: "#0e505c",
          700: "#187484",
          600: "#228b9e",
          500: "#36aabf",
          400: "#60C8D4", // Complementary brand color
          300: "#86d6df",
          200: "#b0e6ec",
          100: "#d9f4f7",
          50: "#f0fbfb",
        },
        ink: {
          DEFAULT: "#12201F", // Main text
          soft: "#4B5C5C",    // Secondary text
          faint: "#8A9695",   // Muted / placeholder text
        },
        line: {
          DEFAULT: "#E2E8E7", // Borders and dividers
          dark: "#20464d",
        },
        surface: {
          DEFAULT: "#FFFFFF", // Background
          alt: "#F5F8F8",     // Secondary background / cards
          dark: "#08363e",
          dark2: "#0B4A55",   // Dark sections / headers / badges
        },
      },
      fontFamily: {
        display: ["var(--font-michroma)", "Michroma", "sans-serif"],
        body: ["var(--font-manrope)", "Manrope", "sans-serif"],
      },
      fontSize: {
        h1: ["48px", { lineHeight: "56px", fontWeight: "700" }],
        h2: ["32px", { lineHeight: "40px", fontWeight: "700" }],
        h3: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "26px", fontWeight: "400" }],
        caption: ["13px", { lineHeight: "18px", fontWeight: "500" }],
      },
      transitionTimingFunction: {
        vague: "cubic-bezier(0.16, 1, 0.3, 1)",
        courant: "cubic-bezier(0.65, 0, 0.35, 1)",
        maree: "cubic-bezier(0.37, 0, 0.63, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        standard: "300ms",
        slow: "500ms",
        ambient: "3200ms",
      },
      animation: {
        "vague-in": "vagueIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "courant-in": "courantIn 300ms cubic-bezier(0.65, 0, 0.35, 1) forwards",
        "ambient-flow": "ambientFlow 3200ms ease-in-out infinite",
      },
      keyframes: {
        vagueIn: {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        courantIn: {
          "0%": { opacity: "0", transform: "translateX(-6px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        ambientFlow: {
          "0%, 100%": { opacity: "0.4", transform: "translateY(0px)" },
          "50%": { opacity: "0.8", transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
