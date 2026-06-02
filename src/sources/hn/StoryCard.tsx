import { useState } from "react";
import type { StoryHit } from "./api";
import { Upvote } from "./voteContext";
import { useSeen } from "./seenContext";
import { usePrefs } from "./prefsContext";
import { ArticlePeek } from "./ArticlePeek";
import { isExtension } from "../../lib/runtime";
import { faviconUrl, hostname, timeAgo } from "../../lib/format";

type Props = {
  hit: StoryHit;
  rank: number;
  onOpen: () => void;
  selected?: boolean;
};

export function StoryCard({ hit, rank, onOpen, selected = false }: Props) {
  const host = hostname(hit.url);
  const favicon = faviconUrl(hit.url);
  const [imgFailed, setImgFailed] = useState(false);
  const points = hit.points ?? 0;
  const comments = hit.num_comments ?? 0;
  const id = Number(hit.objectID);
  const seen = useSeen();
  const prefs = usePrefs();
  const isSaved = prefs.isSaved(hit.objectID);
  const isSeen = seen.isSeen(id);
  // Velocity: (points + comments) per hour since posting. Flag "hot" stories.
  const ageHours = Math.max(0.5, (Date.now() / 1000 - hit.created_at_i) / 3600);
  const velocity = Math.round((points + comments) / ageHours);
  const isHot = velocity >= 50;
  const [peekOpen, setPeekOpen] = useState(false);
  const canPeek = !!hit.url && isExtension();
  const open = () => {
    seen.markSeen(id);
    onOpen();
  };

  return (
    <article
      className={
        "card group relative overflow-hidden p-4 transition hover:border-[color:var(--color-fg-muted)]/40 sm:p-5 " +
        (isSeen ? "opacity-[.55] " : "") +
        (selected ? "ring-2 ring-[color:var(--color-accent)]" : "")
      }
    >
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
                onClick={() => seen.markSeen(id)}
                className="transition hover:text-[color:var(--color-accent)]"
              >
                {hit.title}
              </a>
            ) : (
              <button
                type="button"
                onClick={open}
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
              <Upvote id={Number(hit.objectID)} />
              <Spark className="size-3.5" />
              <span className="font-mono tabular-nums">{points}</span>
            </span>
            <span>by {hit.author}</span>
            <span>·</span>
            <span>{timeAgo(hit.created_at_i)}</span>
            <button
              type="button"
              onClick={() => prefs.toggleSave(hit)}
              aria-pressed={isSaved}
              aria-label={isSaved ? "Remove bookmark" : "Save story"}
              className={
                "transition " +
                (isSaved
                  ? "text-[color:var(--color-accent)]"
                  : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]")
              }
            >
              <svg
                viewBox="0 0 24 24"
                className="size-3.5"
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            {host && (
              <button
                type="button"
                onClick={() => prefs.mute(host)}
                aria-label={`Mute ${host}`}
                title={`Mute ${host}`}
                className="text-[color:var(--color-fg-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[color:var(--color-fg)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 3l18 18M9 5l3-2v12m-4 4a5 5 0 0 1-3-4M5 9v6h4l5 4" />
                </svg>
              </button>
            )}
            {isHot && (
              <span
                className="inline-flex items-center gap-1 font-medium text-[color:var(--color-accent)]"
                title={`${velocity} points + comments per hour`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2c1 3-1 4-2 6s0 4 2 4 3-2 2-5c2 1 4 4 4 7a6 6 0 1 1-12 0c0-4 4-6 6-12z" />
                </svg>
                <span className="font-mono tabular-nums">{velocity}/h</span>
              </span>
            )}
            {canPeek && (
              <button
                type="button"
                onClick={() => setPeekOpen((p) => !p)}
                aria-expanded={peekOpen}
                className={
                  "inline-flex items-center gap-1 font-medium transition " +
                  (peekOpen
                    ? "text-[color:var(--color-accent)]"
                    : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]")
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Preview
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={open}
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
      {peekOpen && hit.url && <ArticlePeek url={hit.url} />}
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
