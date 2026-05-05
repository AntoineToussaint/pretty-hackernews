import { useEffect, useState } from "react";

type Props = {
  lastUpdated: number | null;
  refreshing: boolean;
};

export function LiveIndicator({ lastUpdated, refreshing }: Props) {
  const [, force] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const label = (() => {
    if (refreshing) return "Refreshing…";
    if (lastUpdated === null) return "Loading…";
    const diffSec = Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));
    if (diffSec < 5) return "Updated just now";
    if (diffSec < 60) return `Updated ${diffSec}s ago`;
    const m = Math.floor(diffSec / 60);
    return `Updated ${m}m ago`;
  })();

  return (
    <div className="mb-3 flex items-center gap-2 px-1 text-[11px] text-[color:var(--color-fg-muted)]">
      <span className="relative flex size-2">
        <span
          className={
            "absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75 " +
            (refreshing ? "animate-ping" : "")
          }
        />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
      </span>
      <span className="font-medium uppercase tracking-wider">Live</span>
      <span aria-hidden="true">·</span>
      <span>{label}</span>
    </div>
  );
}
