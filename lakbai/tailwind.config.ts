import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "lakbai-green": "var(--color-lakbai-green)",
        "lakbai-green-dark": "var(--color-lakbai-green-dark)",
        "lakbai-lime": "var(--color-lakbai-lime)",
        "lakbai-green-light": "var(--color-lakbai-green-light)",
        "lakbai-green-bg": "var(--color-lakbai-green-bg)",
        "lakbai-gray": "var(--color-lakbai-gray)",
        "lakbai-gray-text": "var(--color-lakbai-gray-text)",
        "lakbai-gray-dark": "var(--color-lakbai-gray-dark)",
      },
      fontFamily: {
        sans: ["Stack Sans Notch", "Inter", "Raleway", "system-ui", "sans-serif"],
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
  plugins: [],
} satisfies Config;
