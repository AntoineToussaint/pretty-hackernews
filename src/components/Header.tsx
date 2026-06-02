import { useRef, useState } from "react";
import type { ThemeId } from "../lib/themes";
import type { Source } from "../sources/types";
import { ThemeSwitcher } from "./ThemeSwitcher";

type Props = {
  sources: Source[];
  activeSource: Source;
  onSourceChange: (id: string) => void;
  /** Active feed id, or null when an item is open (feed tabs hidden). */
  feedId: string | null;
  onFeedChange: (feedId: string) => void;
  onOpenItem: (id: string) => void;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  /** Show the paste-a-link box (web app); off for the in-place reader. */
  showSearch?: boolean;
  /** Show the inline theme dropdown (web app); off for the in-place reader. */
  showThemeSwitcher?: boolean;
  /** Show the settings gear. */
  showSettings?: boolean;
  /** If provided, the gear is a button calling this; else it links to #/settings. */
  onOpenSettings?: () => void;
  /** If provided, shows a bookmark button that toggles the saved view. */
  onToggleSaved?: () => void;
  savedActive?: boolean;
};

export function Header({
  sources,
  activeSource,
  onSourceChange,
  feedId,
  onFeedChange,
  onOpenItem,
  theme,
  onThemeChange,
  showSearch = true,
  showThemeSwitcher = true,
  showSettings = true,
  onOpenSettings,
  onToggleSaved,
  savedActive = false,
}: Props) {
  const homeHash = `#/${activeSource.id}/${activeSource.defaultFeed}`;
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl">
      <div className="absolute inset-0 -z-10 bg-[color:var(--color-bg)]/70 border-b border-[color:var(--color-border)]" />
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <a
          href={homeHash}
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="Hatch — home"
        >
          <span className="accent-bg flex size-8 items-center justify-center rounded-xl shadow-md shadow-[color:var(--color-accent)]/30">
            <svg
              viewBox="0 0 32 32"
              className="size-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 9l7 8 7-8M16 17v8" />
            </svg>
          </span>
          <span className="text-base font-semibold tracking-tight">
            Hatch
          </span>
        </a>

        {sources.length > 1 && (
          <SourceSwitcher
            sources={sources}
            activeId={activeSource.id}
            onChange={onSourceChange}
          />
        )}

        {showSearch && activeSource.parseItemId ? (
          <PasteInput
            placeholder={activeSource.searchPlaceholder ?? "Open by link or ID…"}
            parseItemId={activeSource.parseItemId}
            onOpenItem={onOpenItem}
          />
        ) : (
          <div className="flex-1" />
        )}

        {activeSource.AccountStatus && <activeSource.AccountStatus />}

        {showThemeSwitcher && (
          <ThemeSwitcher theme={theme} onChange={onThemeChange} />
        )}

        {onToggleSaved && (
          <button
            type="button"
            onClick={onToggleSaved}
            aria-label="Saved stories"
            aria-pressed={savedActive}
            className={
              "grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-[color:var(--color-border)] transition " +
              (savedActive
                ? "text-[color:var(--color-accent)]"
                : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]")
            }
          >
            <svg
              viewBox="0 0 24 24"
              className="size-[18px]"
              fill={savedActive ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}

        {showSettings &&
          (onOpenSettings ? (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Settings"
              className="grid size-9 shrink-0 place-items-center rounded-xl text-[color:var(--color-fg-muted)] ring-1 ring-[color:var(--color-border)] transition hover:text-[color:var(--color-fg)]"
            >
              <GearIcon />
            </button>
          ) : (
            <a
              href="#/settings"
              aria-label="Settings"
              className="grid size-9 shrink-0 place-items-center rounded-xl text-[color:var(--color-fg-muted)] ring-1 ring-[color:var(--color-border)] transition hover:text-[color:var(--color-fg)]"
            >
              <GearIcon />
            </a>
          ))}
      </div>

      {feedId !== null && (
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 pb-2">
          {activeSource.feeds.map((f) => {
            const active = f.id === feedId;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFeedChange(f.id)}
                className={
                  "relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition " +
                  (active
                    ? "text-[color:var(--color-fg)]"
                    : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]")
                }
              >
                {active && (
                  <span className="absolute inset-0 -z-10 rounded-full bg-[color:var(--color-bg-elev)] ring-1 ring-[color:var(--color-border)]" />
                )}
                {f.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SourceSwitcher({
  sources,
  activeId,
  onChange,
}: {
  sources: Source[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1 rounded-xl bg-[color:var(--color-bg-elev)]/70 p-0.5 ring-1 ring-[color:var(--color-border)]">
      {sources.map((s) => {
        const active = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={
              "whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition " +
              (active
                ? "bg-[color:var(--color-bg)] text-[color:var(--color-fg)] ring-1 ring-[color:var(--color-border)]"
                : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]")
            }
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

function PasteInput({
  placeholder,
  parseItemId,
  onOpenItem,
}: {
  placeholder: string;
  parseItemId: (input: string) => string | null;
  onOpenItem: (id: string) => void;
}) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tryNavigate = (raw: string): boolean => {
    const id = parseItemId(raw);
    if (id) {
      setValue("");
      inputRef.current?.blur();
      onOpenItem(id);
      return true;
    }
    return false;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    if (!tryNavigate(value)) {
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (tryNavigate(pasted)) {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={onSubmit} className="min-w-0 flex-1">
      <label className="relative block">
        <span className="sr-only">{placeholder}</span>
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--color-fg-muted)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.07 0l3.54-3.54a5 5 0 0 0-7.07-7.07L12 4M14 11a5 5 0 0 0-7.07 0l-3.54 3.54a5 5 0 0 0 7.07 7.07L12 20" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          inputMode="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={onPaste}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className={
            "w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)]/70 py-2 pl-9 pr-3 text-sm text-[color:var(--color-fg)] placeholder:text-[color:var(--color-fg-muted)] outline-none transition focus:border-transparent focus:ring-accent " +
            (shake ? "animate-[shake_0.3s_ease-in-out]" : "")
          }
        />
      </label>
    </form>
  );
}
