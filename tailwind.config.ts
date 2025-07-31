/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // NEW: Defining a fresh color palette
      colors: {
        background: "#f0f2f5", // Light Gray background
        surface: "#ffffff", // White for cards
        primary: "#007bff", // Bright Blue for primary actions
        "primary-hover": "#0056b3",
        secondary: "#6c757d", // Gray for secondary text
        "text-primary": "#212529", // Dark text for readability
        "text-secondary": "#495057",
        accent: "#17a2b8", // Teal for accents
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
export default config;
