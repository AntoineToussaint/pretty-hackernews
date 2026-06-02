import { THEMES, type ThemeId } from "../lib/themes";
import { usePrefs } from "../sources/hn/prefsContext";

type Props = {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  onClose: () => void;
  /** Optional "open HN to" default-feed control. */
  feeds?: { id: string; label: string }[];
  defaultFeed?: string;
  onDefaultFeedChange?: (id: string) => void;
};

/** Lightweight settings popover anchored to the header gear. */
export function SettingsPopover({
  theme,
  onThemeChange,
  onClose,
  feeds,
  defaultFeed,
  onDefaultFeedChange,
}: Props) {
  const prefs = usePrefs();
  return (
    <>
      {/* click-away backdrop */}
      <div className="fixed inset-0 z-[60]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Settings"
        className="card fixed right-4 top-16 z-[61] w-64 p-3 shadow-xl"
      >
        <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-muted)]">
          Theme
        </div>
        <div className="space-y-0.5">
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onThemeChange(t.id)}
                aria-pressed={active}
                className={
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition " +
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

        {feeds && onDefaultFeedChange && (
          <div className="mt-3 border-t border-[color:var(--color-border)] pt-3">
            <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-muted)]">
              Open HN to
            </div>
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
                      "rounded-full px-2.5 py-1 text-xs font-medium transition " +
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

        {prefs.muted.length > 0 && (
          <div className="mt-3 border-t border-[color:var(--color-border)] pt-3">
            <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-muted)]">
              Muted domains
            </div>
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
      </div>
    </>
  );
}
