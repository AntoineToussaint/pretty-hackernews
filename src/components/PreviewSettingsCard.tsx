import { useEffect, useState } from "react";

const ORIGINS = ["*://*/*"];

/**
 * Enable / disable the optional host permission that powers inline article
 * previews. Only valid on extension pages (popup, options) — content scripts
 * can't call chrome.permissions, which is why the in-reader prompt routes here.
 */
export function PreviewSettingsCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    chrome.permissions.contains({ origins: ORIGINS }, (g) => setEnabled(g));
  }, []);

  const toggle = () => {
    if (enabled) {
      chrome.permissions.remove({ origins: ORIGINS }, (ok) => ok && setEnabled(false));
    } else {
      chrome.permissions.request({ origins: ORIGINS }, (ok) => ok && setEnabled(true));
    }
  };

  return (
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
  );
}
