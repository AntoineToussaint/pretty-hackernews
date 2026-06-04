import { hueFor, monogram } from "../../lib/format";

/**
 * A site "favicon" rendered entirely locally as a coloured monogram tile — no
 * network request, so no per-domain calls to a favicon service and no 404s.
 * Text posts (no host) get a neutral speech-bubble tile.
 */
export function SiteIcon({
  host,
  className = "size-10 text-sm",
}: {
  host: string | null;
  className?: string;
}) {
  if (!host) {
    return (
      <div
        className={
          "grid shrink-0 place-items-center rounded-lg bg-[color:var(--color-bg)] ring-1 ring-[color:var(--color-border)] " +
          className
        }
      >
        <span className="text-[color:var(--color-fg-muted)]">💬</span>
      </div>
    );
  }
  return (
    <div
      className={
        "grid shrink-0 place-items-center rounded-lg font-bold text-white ring-1 ring-black/10 " +
        className
      }
      style={{ background: `hsl(${hueFor(host)} 48% 45%)` }}
      aria-hidden="true"
    >
      {monogram(host)}
    </div>
  );
}
