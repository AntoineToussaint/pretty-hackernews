import { useEffect, useRef, useState } from "react";
import { THEMES, type ThemeId } from "../lib/themes";

type Props = {
  theme: ThemeId;
  onChange: (theme: ThemeId) => void;
};

export function ThemeSwitcher({ theme, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${current.name}. Click to change.`}
        className="grid size-9 place-items-center rounded-lg border border-[color:var(--color-border)] transition hover:bg-[color:var(--color-bg-elev)]"
      >
        <Swatch colors={current.swatch} className="size-4.5" />
      </button>

      {open && (
        <div
          role="menu"
          className="card fade-in-up absolute right-0 top-full z-50 mt-2 w-60 origin-top-right overflow-hidden p-1.5"
          style={{ animationDuration: "0.18s" }}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-fg-muted)]">
            Theme
          </div>
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                role="menuitemradio"
                aria-checked={active}
                type="button"
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
                className={
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition " +
                  (active
                    ? "bg-[color:var(--color-bg)]"
                    : "hover:bg-[color:var(--color-bg)]/60")
                }
              >
                <Swatch colors={t.swatch} className="size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-[color:var(--color-fg-muted)]">
                    {t.description}
                  </div>
                </div>
                {active && (
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4 shrink-0 text-[color:var(--color-accent)]"
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
    </div>
  );
}

function Swatch({
  colors,
  className,
}: {
  colors: [string, string];
  className?: string;
}) {
  return (
    <span
      className={
        "block rounded-full ring-1 ring-[color:var(--color-border)] " +
        (className ?? "")
      }
      style={{
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      }}
      aria-hidden="true"
    />
  );
}
