import type { Feed } from "../lib/api";
import { useFeedAutoRefresh } from "../lib/useFeedAutoRefresh";
import { StoryCard } from "./StoryCard";
import { StoryCardSkeleton } from "./Skeleton";
import { LiveIndicator } from "./LiveIndicator";

type Props = {
  feed: Feed;
  onOpenStory: (id: string | number) => void;
};

export function StoryList({ feed, onOpenStory }: Props) {
  const { hits, error, lastUpdated, refreshing } = useFeedAutoRefresh(feed);

  if (error && !hits) {
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
    <>
      <LiveIndicator lastUpdated={lastUpdated} refreshing={refreshing} />
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
    </>
  );
}
