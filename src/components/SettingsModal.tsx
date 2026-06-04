import { useState } from "react";
import { THEMES, type ThemeId } from "../lib/themes";
import { usePrefs } from "../sources/hn/prefsContext";
import { AiProfileForm } from "./AiProfileForm";

type Props = {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  onClose: () => void;
  feeds?: { id: string; label: string }[];
  defaultFeed?: string;
  onDefaultFeedChange?: (id: string) => void;
};

const sectionTitle =
  "mb-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-muted)]";

/** The single in-reader settings surface — everything lives here, on the page. */
export function SettingsModal({
  theme,
  onThemeChange,
  onClose,
  feeds,
  defaultFeed,
  onDefaultFeedChange,
}: Props) {
  const prefs = usePrefs();
  const [themeOpen, setThemeOpen] = useState(false);
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div
      className="fixed inset-0 z-[2147483640] grid place-items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[6vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Hatch settings"
    >
      <div
        className="card w-full max-w-lg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="grid size-8 place-items-center rounded-full text-[color:var(--color-fg-muted)] transition hover:bg-[color:var(--color-bg-elev)] hover:text-[color:var(--color-fg)]"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Theme */}
        <div className={sectionTitle}>Theme</div>
        <button
          type="button"
          onClick={() => setThemeOpen((o) => !o)}
          aria-expanded={themeOpen}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm ring-1 ring-[color:var(--color-border)] transition hover:bg-[color:var(--color-bg-elev)]"
        >
          <span
            className="size-5 shrink-0 rounded-md ring-1 ring-[color:var(--color-border)]"
            style={{
              background: `linear-gradient(135deg, ${current.swatch[0]}, ${current.swatch[1]})`,
            }}
          />
          <span className="flex-1 font-medium">{current.name}</span>
          <svg
            viewBox="0 0 24 24"
            className={
              "size-4 text-[color:var(--color-fg-muted)] transition " +
              (themeOpen ? "rotate-180" : "")
            }
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {themeOpen && (
          <div className="mt-1 max-h-60 space-y-0.5 overflow-y-auto pr-0.5">
            {THEMES.map((t) => {
              const active = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onThemeChange(t.id);
                    setThemeOpen(false);
                  }}
                  aria-pressed={active}
                  className={
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition " +
                    (active
                      ? "bg-[color:var(--color-bg-elev)] ring-1 ring-[color:var(--color-accent)]"
                      : "hover:bg-[color:var(--color-bg-elev)]")
                  }
                >
                  <span
                    className="size-5 shrink-0 rounded-md ring-1 ring-[color:var(--color-border)]"
                    style={{
                      background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})`,
                    }}
                  />
                  <span className="flex-1 font-medium">{t.name}</span>
                  {active && (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4 text-[color:var(--color-accent)]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Default feed */}
        {feeds && onDefaultFeedChange && (
          <div className="mt-6 border-t border-[color:var(--color-border)] pt-5">
            <div className={sectionTitle}>Open HN to</div>
            <div className="flex flex-wrap gap-1.5">
              {feeds.map((f) => {
                const active = f.id === defaultFeed;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onDefaultFeedChange(f.id)}
                    aria-pressed={active}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                      (active
                        ? "accent-bg text-white"
                        : "bg-[color:var(--color-bg-elev)] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]")
                    }
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Muted domains */}
        {prefs.muted.length > 0 && (
          <div className="mt-6 border-t border-[color:var(--color-border)] pt-5">
            <div className={sectionTitle}>Muted domains</div>
            <div className="flex flex-wrap gap-1.5">
              {prefs.muted.map((host) => (
                <button
                  key={host}
                  type="button"
                  onClick={() => prefs.unmute(host)}
                  title={`Unmute ${host}`}
                  className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-bg-elev)] px-2.5 py-1 text-xs text-[color:var(--color-fg-muted)] transition hover:text-[color:var(--color-fg)]"
                >
                  {host}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI & profile */}
        <div className="mt-6 border-t border-[color:var(--color-border)] pt-5">
          <div className={sectionTitle}>✨ AI &amp; profile</div>
          <p className="mb-1 text-xs text-[color:var(--color-fg-muted)]">
            Bring your own key. It's stored only in this browser and used to call
            the provider directly — nothing goes to any other server.
          </p>
          <AiProfileForm />
        </div>
      </div>
    </div>
  );
}
