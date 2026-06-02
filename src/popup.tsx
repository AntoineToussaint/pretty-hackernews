import { useEffect, useState } from "react";

// Self-contained inline styles (the popup is a separate page; no Tailwind here).
const ORIGINS = ["*://*/*"];

const colors = {
  bg: "#0a0a0c",
  elev: "#161619",
  border: "rgba(255,255,255,.1)",
  fg: "#ececf1",
  muted: "#8e8e99",
  accent: "#ff5c1a",
  accent2: "#ff2d8a",
};

export default function Popup() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    chrome.permissions.contains({ origins: ORIGINS }, (g) => setEnabled(g));
  }, []);

  const toggle = () => {
    if (enabled) {
      chrome.permissions.remove({ origins: ORIGINS }, (ok) => {
        if (ok) setEnabled(false);
      });
    } else {
      // Must run in this gesture — popup is an extension page, so this works.
      chrome.permissions.request({ origins: ORIGINS }, (ok) => {
        if (ok) setEnabled(true);
      });
    }
  };

  return (
    <div
      style={{
        width: 300,
        padding: 16,
        background: colors.bg,
        color: colors.fg,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 28,
            height: 28,
            borderRadius: 9,
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
            color: "#fff",
            fontWeight: 800,
          }}
        >
          H
        </span>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Hatch</div>
      </div>
      <p style={{ margin: "8px 0 14px", fontSize: 12.5, color: colors.muted }}>
        A calmer Hacker News, rendered in place. Open news.ycombinator.com to use
        it.
      </p>

      <div
        style={{
          background: colors.elev,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          padding: 12,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>Article previews</div>
        <p style={{ margin: "6px 0 10px", fontSize: 12, color: colors.muted }}>
          Lets the reader fetch a linked page to show a clean inline preview.
          Off by default; a page is only fetched when you click “Preview”.
        </p>
        <button
          type="button"
          onClick={toggle}
          disabled={enabled === null}
          style={{
            width: "100%",
            border: 0,
            borderRadius: 999,
            padding: "9px 0",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            color: enabled ? colors.fg : "#fff",
            background: enabled
              ? "transparent"
              : `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
            boxShadow: enabled ? `inset 0 0 0 1px ${colors.border}` : "none",
          }}
        >
          {enabled === null
            ? "…"
            : enabled
              ? "Previews enabled — turn off"
              : "Enable article previews"}
        </button>
      </div>
    </div>
  );
}
