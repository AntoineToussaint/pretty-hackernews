import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";

// Apply the saved theme before first render. This used to be an inline script in
// index.html, but extension pages block inline scripts (MV3 CSP), so it lives in
// the bundle instead. index.html ships with theme-hatch as the default.
try {
  const saved = localStorage.getItem("theme");
  const allowed = ["hatch", "mist", "forest", "paper", "mono"];
  if (saved && allowed.includes(saved)) {
    const el = document.documentElement;
    for (const a of allowed) el.classList.remove(`theme-${a}`);
    el.classList.add(`theme-${saved}`);
  }
} catch {
  /* localStorage unavailable — fall back to the default theme */
}

console.info(
  "[hatch] boot — theme:",
  document.documentElement.className,
  "| extension:",
  Boolean(
    (globalThis as unknown as { chrome?: { runtime?: { id?: string } } }).chrome
      ?.runtime?.id,
  ),
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
