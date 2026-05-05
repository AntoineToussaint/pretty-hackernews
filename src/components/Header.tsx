import { useRef, useState } from "react";
import type { Feed } from "../lib/api";
import { parseHnId } from "../lib/format";

const FEEDS: { id: Feed; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "new", label: "New" },
  { id: "best", label: "Best" },
  { id: "ask", label: "Ask" },
  { id: "show", label: "Show" },
  { id: "jobs", label: "Jobs" },
];

type Props = {
  feed: Feed | null;
  onFeedChange: (feed: Feed) => void;
  onOpenStory: (id: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Header({
  feed,
  onFeedChange,
  onOpenStory,
  theme,
  onToggleTheme,
}: Props) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl">
      <div className="absolute inset-0 -z-10 bg-[color:var(--color-bg)]/70 border-b border-[color:var(--color-border)]" />
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <a
          href="#/top"
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

        <PasteInput onOpenStory={onOpenStory} />

        <button
          type="button"
          onClick={onToggleTheme}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-[color:var(--color-border)] text-[color:var(--color-fg-muted)] transition hover:bg-[color:var(--color-bg-elev)] hover:text-[color:var(--color-fg)]"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {feed !== null && (
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 pb-2">
          {FEEDS.map((f) => {
            const active = f.id === feed;
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

function PasteInput({ onOpenStory }: { onOpenStory: (id: string) => void }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tryNavigate = (raw: string): boolean => {
    const id = parseHnId(raw);
    if (id) {
      setValue("");
      inputRef.current?.blur();
      onOpenStory(id);
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
        <span className="sr-only">Open by HN link or item ID</span>
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
          placeholder="Paste an HN link or item ID…"
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
