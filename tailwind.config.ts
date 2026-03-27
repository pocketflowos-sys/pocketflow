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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        success: "hsl(var(--success))",
        danger: "hsl(var(--danger))",
        warning: "hsl(var(--warning))"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.45)",
        soft: "0 12px 40px rgba(0, 0, 0, 0.32)"
      },
      backgroundImage: {
        radial:
          "radial-gradient(circle at top, rgba(245, 179, 46, 0.18), transparent 28%), radial-gradient(circle at right, rgba(20, 184, 166, 0.08), transparent 24%)"
      }
    }
  },
  plugins: []
};

export default config;
