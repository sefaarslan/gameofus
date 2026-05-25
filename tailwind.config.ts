import type { Config } from "tailwindcss";

export default {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./i18n/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Game of Us — Soft-Tactile Modernism palette
        primary: "#ae2f34",
        "on-primary": "#ffffff",
        "primary-container": "#ff6b6b",
        "on-primary-container": "#6d0010",
        "primary-fixed": "#ffdad8",
        "primary-fixed-dim": "#ffb3b0",
        "on-primary-fixed": "#410006",
        "on-primary-fixed-variant": "#8c1520",

        secondary: "#635d59",
        "on-secondary": "#ffffff",
        "secondary-container": "#e7ded9",
        "on-secondary-container": "#68615e",
        "secondary-fixed": "#eae1dc",
        "secondary-fixed-dim": "#cec5c0",
        "on-secondary-fixed": "#1f1b18",
        "on-secondary-fixed-variant": "#4b4642",

        tertiary: "#705d00",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#caa800",
        "on-tertiary-container": "#4c3e00",
        "tertiary-fixed": "#ffe173",
        "tertiary-fixed-dim": "#e8c426",
        "on-tertiary-fixed": "#221b00",
        "on-tertiary-fixed-variant": "#554500",

        background: "#fff8f6",
        "on-background": "#2c160e",

        surface: "#fff8f6",
        "on-surface": "#2c160e",
        "surface-variant": "#ffdbd0",
        "on-surface-variant": "#584140",
        "surface-bright": "#fff8f6",
        "surface-dim": "#fbd1c4",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#fff1ed",
        "surface-container": "#ffe9e3",
        "surface-container-high": "#ffe2da",
        "surface-container-highest": "#ffdbd0",
        "surface-tint": "#ae2f34",
        "inverse-surface": "#442a22",
        "inverse-on-surface": "#ffede8",
        "inverse-primary": "#ffb3b0",

        outline: "#8c706f",
        "outline-variant": "#e0bfbd",

        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
        // Component-specific
        card: "24px",
      },
      spacing: {
        "container-padding-desktop": "48px",
        "container-padding-mobile": "24px",
        "section-gap": "40px",
        gutter: "24px",
        base: "8px",
      },
      fontFamily: {
        sans: ["var(--font-quicksand)", "Quicksand", "sans-serif"],
        quicksand: ["var(--font-quicksand)", "Quicksand", "sans-serif"],
      },
      fontSize: {
        "headline-xl": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-lg-mobile": ["28px", { lineHeight: "34px", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", fontWeight: "600" }],
      },
      boxShadow: {
        "soft-card": "0 16px 32px -12px rgba(174, 47, 52, 0.08)",
        "soft-active": "0 24px 48px -12px rgba(174, 47, 52, 0.15)",
        "soft-sm": "0 8px 16px -4px rgba(174, 47, 52, 0.06)",
        "primary-glow": "0 16px 32px rgba(174, 47, 52, 0.20)",
      },
      keyframes: {
        "soft-pulse": {
          "0%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(255, 107, 107, 0.4)" },
          "70%": { transform: "scale(1)", boxShadow: "0 0 0 6px rgba(255, 107, 107, 0)" },
          "100%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(255, 107, 107, 0)" },
        },
        "float-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(-8px)", opacity: "0" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "70%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "soft-pulse": "soft-pulse 2s infinite",
        "float-up": "float-up 3s ease-in-out infinite",
        "pop-in": "pop-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
