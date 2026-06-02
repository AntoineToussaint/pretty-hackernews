import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The Vite build is the standalone web reader (GitHub Pages). The browser
// extension is built separately with Plasmo (see `plasmo:*` scripts).
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/pretty-hackernews/" : "/",
  plugins: [react(), tailwindcss()],
}));
