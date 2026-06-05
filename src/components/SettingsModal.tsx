import { useState } from "react";
import { THEMES, type ThemeId } from "../lib/themes";
import { usePrefs } from "../sources/hn/prefsContext";
import { AiProfileForm } from "./AiProfileForm";
import { isExtension } from "../lib/runtime";

type Props = {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  onClose: () => void;
  feeds?: { id: string; label: string }[];
  defaultFeed?: string;
  onDefaultFeedChange?: (id: string) => void;
  /** Turn the reader off and show native Hacker News (in-place reader only). */
  onDisableReader?: () => void;
};

const sectionTitle =
  "mb-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-muted)]";

/** Shared centered-overlay shell so the AI sub-modal matches the main one. */
function Overlay({
  label,
  z,
  onClose,
  children,
}: {
  label: string;
  z: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 grid place-items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[6vh] backdrop-blur-sm"
      style={{ zIndex: z }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className="card w-full max-w-lg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
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
  );
}

/** The AI & profile settings, in their own modal to keep the main one compact. */
function AiSettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <Overlay label="AI & profile settings" z={2147483645} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">✨ AI &amp; profile</h2>
        <CloseButton onClose={onClose} />
      </div>
      {!isExtension() && (
        <div className="mb-4 rounded-lg border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 p-3 text-xs leading-relaxed text-[color:var(--color-fg)]">
          Preview only. AI runs in the installed Pretty Hacker News extension, where your key
          and every request stay in your browser and go straight to the provider
          you choose. It won't actually call a provider on this demo page.
        </div>
      )}
      <p className="mb-1 text-xs leading-relaxed text-[color:var(--color-fg-muted)]">
        Bring your own key — stored only in your browser and used to call the
        provider directly. AI is optional and used only to help you read
        (summaries + matching); it never posts or votes for you.
      </p>
      <AiProfileForm />
    </Overlay>
  );
}

/** The single in-reader settings surface. */
export function SettingsModal({
  theme,
  onThemeChange,
  onClose,
  feeds,
  defaultFeed,
  onDefaultFeedChange,
  onDisableReader,
}: Props) {
  const prefs = usePrefs();
  const [themeOpen, setThemeOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <>
      <Overlay label="Pretty Hacker News settings" z={2147483640} onClose={onClose}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
          <CloseButton onClose={onClose} />
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

        {/* AI & profile — opens its own modal so this one stays compact */}
        <div className="mt-6 border-t border-[color:var(--color-border)] pt-5">
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm ring-1 ring-[color:var(--color-border)] transition hover:bg-[color:var(--color-bg-elev)]"
          >
            <span className="flex-1">
              <span className="font-medium">✨ AI &amp; profile</span>
              <span className="ml-2 text-xs text-[color:var(--color-fg-muted)]">
                summaries &amp; matching — optional
              </span>
            </span>
            <span aria-hidden="true" className="text-[color:var(--color-fg-muted)]">
              →
            </span>
          </button>
        </div>

        {onDisableReader && (
          <div className="mt-6 border-t border-[color:var(--color-border)] pt-5">
            <button
              type="button"
              onClick={onDisableReader}
              className="w-full rounded-lg px-2.5 py-2 text-sm text-[color:var(--color-fg-muted)] ring-1 ring-[color:var(--color-border)] transition hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-bg-elev)]"
            >
              View regular Hacker News
            </button>
            <p className="mt-1.5 px-1 text-xs text-[color:var(--color-fg-muted)]">
              Turns the skin off and shows native HN. Come back any time with the
              “✨ Switch to Pretty HN” button.
            </p>
          </div>
        )}
      </Overlay>

      {aiOpen && <AiSettingsModal onClose={() => setAiOpen(false)} />}
    </>
  );
}
