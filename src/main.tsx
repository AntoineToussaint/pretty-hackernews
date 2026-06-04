import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import interFontUrl from "../assets/InterVariable.woff2?url";
import "./index.css";
import { App } from "./App.tsx";

// Inter is bundled (no third-party font host), injected as @font-face.
const fontStyle = document.createElement("style");
fontStyle.textContent = `@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;src:url("${interFontUrl}") format("woff2");}`;
document.head.appendChild(fontStyle);

// Apply the saved theme before first render. This used to be an inline script in
// index.html, but extension pages block inline scripts (MV3 CSP), so it lives in
// the bundle instead. index.html ships with theme-hatch as the default.
try {
  const saved = localStorage.getItem("theme");
  const allowed = [
    "classic",
    "classic-modern",
    "hatch",
    "mist",
    "forest",
    "paper",
    "mono",
    "bloomberg",
    "matrix",
    "dracula",
    "nord",
    "gruvbox",
    "solarized",
  ];
  if (saved && allowed.includes(saved)) {
    const el = document.documentElement;
    for (const a of allowed) el.classList.remove(`theme-${a}`);
    el.classList.add(`theme-${saved}`);
  }
} catch {
  /* localStorage unavailable — fall back to the default theme */
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
