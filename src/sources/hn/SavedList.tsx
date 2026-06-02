import { usePrefs } from "./prefsContext";
import { StoryCard } from "./StoryCard";

export function SavedList({
  onOpenItem,
}: {
  onOpenItem: (id: string) => void;
}) {
  const { saved } = usePrefs();

  if (saved.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-[color:var(--color-fg-muted)]">
        No saved stories yet. Tap the bookmark on any story to save it here.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {saved.map((hit, i) => (
        <li key={hit.objectID}>
          <StoryCard
            hit={hit}
            rank={i + 1}
            onOpen={() => onOpenItem(hit.objectID)}
          />
        </li>
      ))}
    </ul>
  );
}
