import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        "background-secondary": "var(--color-background-secondary)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        sidebar: "var(--color-sidebar)",
        line: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
        muted: "var(--color-text-muted)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
      },
      fontFamily: {
        sans: ["var(--font-pixelify)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-pixelify)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["3.75rem", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        heading: ["2rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        subheading: ["1.125rem", { lineHeight: "1.4" }],
        body: ["1rem", { lineHeight: "1.65", letterSpacing: "0.015em" }],
        small: ["0.875rem", { lineHeight: "1.55", letterSpacing: "0.012em" }],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
