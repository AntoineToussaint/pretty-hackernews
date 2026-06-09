import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedViewProps } from "../types";
import type { Feed as HnFeed } from "./api";
import { useFeedAutoRefresh } from "./useFeedAutoRefresh";
import { useHnVote } from "./voteContext";
import { usePrefs } from "./prefsContext";
import { StoryCard } from "./StoryCard";
import { StoryCardSkeleton } from "./Skeleton";
import { LiveIndicator } from "../../components/LiveIndicator";
import { hostname } from "../../lib/format";

export function Feed({ feedId, onOpenItem }: FeedViewProps) {
  const { hits, error, lastUpdated, refreshing } = useFeedAutoRefresh(
    feedId as HnFeed,
  );
  const vote = useHnVote();
  const prefs = usePrefs();
  // Hide stories from muted domains.
  const visible = useMemo(
    () => (hits ? hits.filter((h) => !prefs.isMuted(hostname(h.url))) : null),
    [hits, prefs],
  );
  const [selected, setSelected] = useState(-1);
  const selectedRef = useRef(-1);
  const listRef = useRef<HTMLUListElement>(null);
  // Which card's article preview is open (objectID), owned here so only one is
  // open at a time and switching between them is a single atomic state change —
  // no close-then-reopen race when clicking another card's Preview button.
  const [openPeek, setOpenPeek] = useState<string | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // reset selection when switching feeds
  useEffect(() => {
    setSelected(-1);
    setOpenPeek(null);
  }, [feedId]);

  // Close the open preview only when clicking fully outside the feed list.
  // Clicks on another card (incl. its Preview button) stay inside the list, so
  // they fall through to that button and just switch which preview is open.
  useEffect(() => {
    if (!openPeek) return;
    const onDown = (e: Event) => {
      const path = (e.composedPath?.() ?? []) as EventTarget[];
      if (listRef.current && !path.includes(listRef.current)) setOpenPeek(null);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [openPeek]);

  // keyboard navigation: j/k move, o/Enter/c open, u upvote
  useEffect(() => {
    if (!visible || visible.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setSelected((s) => Math.min(visible.length - 1, s + 1));
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setSelected((s) => Math.max(0, (s < 0 ? 0 : s) - 1));
          break;
        case "o":
        case "c":
        case "Enter":
          if (selectedRef.current >= 0) {
            e.preventDefault();
            onOpenItem(visible[selectedRef.current].objectID);
          }
          break;
        case "u":
          if (selectedRef.current >= 0 && vote.enabled) {
            e.preventDefault();
            vote.toggle(Number(visible[selectedRef.current].objectID));
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onOpenItem, vote]);

  // keep the selected card in view
  useEffect(() => {
    if (selected < 0 || !listRef.current) return;
    const el = listRef.current.children[selected] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

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
      <ul ref={listRef} className="space-y-3">
        {(visible ?? []).map((hit, i) => (
          <li
            key={hit.objectID}
            className="fade-in-up"
            style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
          >
            <StoryCard
              hit={hit}
              rank={i + 1}
              selected={i === selected}
              onOpen={() => onOpenItem(hit.objectID)}
              peekOpen={openPeek === hit.objectID}
              onPeekToggle={() =>
                setOpenPeek((p) => (p === hit.objectID ? null : hit.objectID))
              }
            />
          </li>
        ))}
      </ul>
    </>
  );
}
