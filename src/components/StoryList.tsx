import { useEffect, useState } from "react";
import { fetchFeed, type Feed, type StoryHit } from "../lib/api";
import { StoryCard } from "./StoryCard";
import { StoryCardSkeleton } from "./Skeleton";

type Props = {
  feed: Feed;
  onOpenStory: (id: string | number) => void;
};

export function StoryList({ feed, onOpenStory }: Props) {
  const [hits, setHits] = useState<StoryHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHits(null);
    setError(null);
    fetchFeed(feed)
      .then((data) => {
        if (!cancelled) setHits(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [feed]);

  if (error) {
    return (
      <div className="card p-6 text-sm text-[color:var(--color-fg-muted)]">
        Couldn't load stories: {error}
      </div>
    );
  }

  if (!hits) {
    return (
      <ul className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <StoryCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-3">
      {hits.map((hit, i) => (
        <li
          key={hit.objectID}
          className="fade-in-up"
          style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
        >
          <StoryCard
            hit={hit}
            rank={i + 1}
            onOpen={() => onOpenStory(hit.objectID)}
          />
        </li>
      ))}
    </ul>
  );
}
