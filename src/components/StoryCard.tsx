import { useState } from "react";
import type { StoryHit } from "../lib/api";
import { faviconUrl, hostname, timeAgo } from "../lib/format";

type Props = {
  hit: StoryHit;
  rank: number;
  onOpen: () => void;
};

export function StoryCard({ hit, rank, onOpen }: Props) {
  const host = hostname(hit.url);
  const favicon = faviconUrl(hit.url);
  const [imgFailed, setImgFailed] = useState(false);
  const points = hit.points ?? 0;
  const comments = hit.num_comments ?? 0;

  return (
    <article className="card group relative overflow-hidden p-4 transition hover:border-[color:var(--color-fg-muted)]/40 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="flex shrink-0 flex-col items-center gap-2 pt-0.5">
          <span className="font-mono text-xs tabular-nums text-[color:var(--color-fg-muted)]">
            {String(rank).padStart(2, "0")}
          </span>
          <div className="grid size-10 place-items-center overflow-hidden rounded-lg bg-[color:var(--color-bg)] ring-1 ring-[color:var(--color-border)]">
            {favicon && !imgFailed ? (
              <img
                src={favicon}
                alt=""
                width={20}
                height={20}
                className="size-5"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="text-base">{host ? "🔗" : "💬"}</span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold leading-snug tracking-tight sm:text-base">
            {hit.url ? (
              <a
                href={hit.url}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-[color:var(--color-accent)]"
              >
                {hit.title}
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpen}
                className="text-left transition hover:text-[color:var(--color-accent)]"
              >
                {hit.title}
              </button>
            )}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--color-fg-muted)]">
            {host && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-bg)] px-2 py-0.5 ring-1 ring-[color:var(--color-border)]">
                {host}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Spark className="size-3.5" />
              <span className="font-mono tabular-nums">{points}</span>
            </span>
            <span>by {hit.author}</span>
            <span>·</span>
            <span>{timeAgo(hit.created_at_i)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 self-stretch rounded-xl px-3 text-xs font-medium text-[color:var(--color-fg-muted)] ring-1 ring-[color:var(--color-border)] transition hover:bg-[color:var(--color-bg)] hover:text-[color:var(--color-fg)]"
          aria-label={`Open ${comments} comments`}
        >
          <span className="block font-mono text-base font-semibold tabular-nums text-[color:var(--color-fg)]">
            {comments}
          </span>
          <span className="block text-[10px] uppercase tracking-wider">
            {comments === 1 ? "reply" : "replies"}
          </span>
        </button>
      </div>
    </article>
  );
}

function Spark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2l2.39 5.26L20 8.27l-4 3.9.94 5.5L12 15.1 7.06 17.67 8 12.17l-4-3.9 5.61-1.01L12 2z" />
    </svg>
  );
}
