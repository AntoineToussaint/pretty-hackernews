import "./compiled.css";
import { useEffect, useState } from "react";

const ORIGINS = ["*://*/*"];

export default function Popup() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    chrome.permissions.contains({ origins: ORIGINS }, (g) => setEnabled(g));
    chrome.storage.local.get("theme", (r) =>
      document.documentElement.classList.add(
        `theme-${typeof r.theme === "string" ? r.theme : "classic"}`,
      ),
    );
  }, []);

  const toggle = () => {
    if (enabled) {
      chrome.permissions.remove({ origins: ORIGINS }, (ok) => ok && setEnabled(false));
    } else {
      chrome.permissions.request({ origins: ORIGINS }, (ok) => ok && setEnabled(true));
    }
  };

  return (
    <div className="w-[300px] p-4 text-[color:var(--color-fg)]">
      <div className="flex items-center gap-2.5">
        <span className="accent-bg grid size-7 place-items-center rounded-[9px] font-extrabold text-white">
          H
        </span>
        <span className="text-[15px] font-bold tracking-tight">
          Pretty Hacker News
        </span>
      </div>
      <p className="mb-3.5 mt-2 text-xs text-[color:var(--color-fg-muted)]">
        A configurable skin for Hacker News, rendered in place. Open
        news.ycombinator.com to use it.
      </p>

      <div className="card p-3">
        <div className="text-[13px] font-semibold">Article previews</div>
        <p className="my-1.5 text-xs text-[color:var(--color-fg-muted)]">
          Lets the reader fetch a linked page to show a clean inline preview. Off
          by default; a page is only fetched when you click “Preview”.
        </p>
        <button
          type="button"
          onClick={toggle}
          disabled={enabled === null}
          className={
            "w-full rounded-full py-2 text-[13px] font-semibold transition disabled:opacity-50 " +
            (enabled
              ? "ring-1 ring-[color:var(--color-border)] text-[color:var(--color-fg)]"
              : "accent-bg text-white")
          }
        >
          {enabled === null
            ? "…"
            : enabled
              ? "Previews enabled — turn off"
              : "Enable article previews"}
        </button>
      </div>

      <button
        type="button"
        onClick={() =>
          chrome.tabs.create({ url: chrome.runtime.getURL("options.html") })
        }
        className="mt-2.5 w-full rounded-xl py-2 text-[13px] font-semibold text-[color:var(--color-fg)] ring-1 ring-[color:var(--color-border)] transition hover:bg-[color:var(--color-bg-elev)]"
      >
        ✨ AI &amp; profile settings
      </button>
    </div>
  );
}
