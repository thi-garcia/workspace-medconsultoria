import preset from "@app/ui/tailwind-preset";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    // inclui componentes do design system compartilhado
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  plugins: [animate],
};
