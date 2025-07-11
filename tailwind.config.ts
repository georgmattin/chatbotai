import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#0d1117",
        foreground: "#f0f6fc",
        primary: {
          DEFAULT: "#10a37f",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#21262d",
          foreground: "#f0f6fc",
        },
        destructive: {
          DEFAULT: "#f85149",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#161b22",
          foreground: "#8b949e",
        },
        accent: {
          DEFAULT: "#21262d",
          foreground: "#f0f6fc",
        },
        popover: {
          DEFAULT: "#161b22",
          foreground: "#f0f6fc",
        },
        card: {
          DEFAULT: "#0d1117",
          foreground: "#f0f6fc",
        },
        sidebar: {
          DEFAULT: "#0d1117",
          foreground: "#f0f6fc",
        },
        "chat-user": "#10a37f",
        "chat-assistant": "#161b22",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
