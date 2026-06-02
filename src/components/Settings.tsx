import { THEMES, type ThemeId } from "../lib/themes";

type Props = {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  onBack: () => void;
};

export function Settings({ theme, onThemeChange, onBack }: Props) {
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-fg-muted)] transition hover:text-[color:var(--color-fg)]"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
          Your preference is saved on this device.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="px-1 text-xs font-medium uppercase tracking-wider text-[color:var(--color-fg-muted)]">
          Theme
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onThemeChange(t.id)}
                aria-pressed={active}
                className={
                  "card flex items-center gap-3 p-4 text-left transition " +
                  (active
                    ? "ring-2 ring-[color:var(--color-accent)]"
                    : "hover:border-[color:var(--color-fg-muted)]/40")
                }
              >
                <span
                  className="size-9 shrink-0 rounded-xl ring-1 ring-[color:var(--color-border)]"
                  style={{
                    background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})`,
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{t.name}</span>
                  <span className="block text-xs text-[color:var(--color-fg-muted)]">
                    {t.description}
                  </span>
                </span>
                {active && (
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5 shrink-0 text-[color:var(--color-accent)]"
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
      </section>
    </div>
  );
}
