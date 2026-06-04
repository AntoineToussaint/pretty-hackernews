import { useEffect, useState } from "react";
import {
  aiConfigured,
  loadAiSettings,
  loadAiUsage,
  onAiDataChanged,
  type AiUsage,
} from "../sources/hn/aiDigest";

/**
 * Compact header pill showing today's estimated AI spend (and budget, if set).
 * Renders nothing unless AI is actually configured. Updates live as usage and
 * budget change in storage. Clicking opens settings.
 */
export function AiBudget({ onClick }: { onClick?: () => void }) {
  const [enabled, setEnabled] = useState(false);
  const [budget, setBudget] = useState(0);
  const [usage, setUsage] = useState<AiUsage | null>(null);

  useEffect(() => {
    let on = true;
    const refresh = () => {
      aiConfigured().then((c) => on && setEnabled(c));
      loadAiSettings().then((s) => on && setBudget(s.dailyBudget));
      loadAiUsage().then((u) => on && setUsage(u));
    };
    refresh();
    const unsub = onAiDataChanged(refresh);
    return () => {
      on = false;
      unsub();
    };
  }, []);

  if (!enabled || !usage) return null;

  const spent = usage.cost;
  const ratio = budget > 0 ? spent / budget : 0;
  const color =
    ratio >= 1
      ? "text-red-400"
      : ratio >= 0.8
        ? "text-amber-400"
        : "text-[color:var(--color-fg-muted)]";
  const label =
    budget > 0 ? `$${spent.toFixed(2)} / $${budget.toFixed(2)}` : `$${spent.toFixed(2)}`;

  return (
    <button
      type="button"
      onClick={onClick}
      title={
        `AI spend today: ~$${spent.toFixed(4)}` +
        (budget > 0 ? ` of $${budget.toFixed(2)} budget` : "") +
        ` · ${usage.requests} request${usage.requests === 1 ? "" : "s"}` +
        ` · ${usage.input.toLocaleString()} in / ${usage.output.toLocaleString()} out tokens`
      }
      className={
        "hidden shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium ring-1 ring-[color:var(--color-border)] transition hover:text-[color:var(--color-fg)] sm:inline-flex " +
        color
      }
    >
      <span className="text-[color:var(--color-accent)]">✨</span>
      <span className="font-mono tabular-nums">{label}</span>
    </button>
  );
}
