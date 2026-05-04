import type { Feed } from "../lib/api";

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
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Header({ feed, onFeedChange, theme, onToggleTheme }: Props) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl">
      <div className="absolute inset-0 -z-10 bg-[color:var(--color-bg)]/70 border-b border-[color:var(--color-border)]" />
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <a
          href="#/top"
          className="group flex items-center gap-2.5"
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
          <span className="hidden text-xs text-[color:var(--color-fg-muted)] sm:inline">
            · a calmer Hacker News
          </span>
        </a>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onToggleTheme}
          className="grid size-9 place-items-center rounded-lg border border-[color:var(--color-border)] text-[color:var(--color-fg-muted)] transition hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-bg-elev)]"
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
