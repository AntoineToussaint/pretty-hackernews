import "./compiled.css";
import { useEffect } from "react";
import { PreviewSettingsCard } from "./components/PreviewSettingsCard";

export default function Popup() {
  useEffect(() => {
    chrome.storage.local.get("theme", (r) =>
      document.documentElement.classList.add(
        `theme-${typeof r.theme === "string" ? r.theme : "classic"}`,
      ),
    );
  }, []);

  return (
    <div className="w-[300px] p-4 text-[color:var(--color-fg)]">
      <div className="flex items-center gap-2.5">
        <span className="accent-bg grid size-7 place-items-center rounded-[9px] text-white">
          <svg
            viewBox="0 0 32 32"
            className="size-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 9l7 8 7-8M16 17v8" />
          </svg>
        </span>
        <span className="text-[15px] font-bold tracking-tight">
          Pretty Hacker News
        </span>
      </div>
      <p className="mb-3.5 mt-2 text-xs text-[color:var(--color-fg-muted)]">
        A configurable skin for Hacker News, rendered in place. Open
        news.ycombinator.com to use it.
      </p>

      <PreviewSettingsCard />

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
