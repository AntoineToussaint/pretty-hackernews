import { useEffect, useState } from "react";
import { fetchStory, type CommentNode, type StoryItem } from "../lib/api";
import { faviconUrl, hostname, timeAgo } from "../lib/format";
import { Comment } from "./Comment";
import { StoryViewSkeleton } from "./Skeleton";

type Props = {
  id: string;
  onBack: () => void;
};

export function StoryView({ id, onBack }: Props) {
  const [story, setStory] = useState<StoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStory(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "instant" });
    fetchStory(id)
      .then((data) => {
        if (!cancelled) setStory(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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

      {error && (
        <div className="card p-6 text-sm text-[color:var(--color-fg-muted)]">
          Couldn't load story: {error}
        </div>
      )}

      {!story && !error && <StoryViewSkeleton />}

      {story && (
        <>
          <StoryHeader story={story} />
          <div>
            <h3 className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-[color:var(--color-fg-muted)]">
              {countComments(story)} comments
            </h3>
            {story.children.length === 0 ? (
              <div className="card p-6 text-center text-sm text-[color:var(--color-fg-muted)]">
                No comments yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {story.children.map((c, i) => (
                  <li
                    key={c.id}
                    className="fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
                  >
                    <Comment node={c} depth={0} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StoryHeader({ story }: { story: StoryItem }) {
  const host = hostname(story.url);
  const favicon = faviconUrl(story.url);
  return (
    <article className="card overflow-hidden p-5 sm:p-6">
      <div className="flex items-start gap-4">
        {favicon && (
          <div className="hidden size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[color:var(--color-bg)] ring-1 ring-[color:var(--color-border)] sm:grid">
            <img src={favicon} alt="" width={24} height={24} className="size-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
            {story.url ? (
              <a
                href={story.url}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-[color:var(--color-accent)]"
              >
                {story.title}
              </a>
            ) : (
              story.title
            )}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[color:var(--color-fg-muted)]">
            {host && (
              <a
                href={story.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-bg)] px-2 py-0.5 ring-1 ring-[color:var(--color-border)] transition hover:text-[color:var(--color-fg)]"
              >
                {host}
              </a>
            )}
            <span className="inline-flex items-center gap-1">
              <span className="accent-text font-mono tabular-nums">
                {story.points ?? 0}
              </span>{" "}
              points
            </span>
            <span>by {story.author}</span>
            <span>·</span>
            <span>{timeAgo(story.created_at_i)}</span>
            <span>·</span>
            <a
              href={`https://news.ycombinator.com/item?id=${story.id}`}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              on HN
            </a>
          </div>
          {story.text && (
            <div
              className="comment-body mt-4 text-[15px] text-[color:var(--color-fg)]"
              dangerouslySetInnerHTML={{ __html: story.text }}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function countComments(story: StoryItem): number {
  let n = 0;
  const walk = (children: CommentNode[]) => {
    for (const c of children) {
      n++;
      walk(c.children);
    }
  };
  walk(story.children);
  return n;
}
